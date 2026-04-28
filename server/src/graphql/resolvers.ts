import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User } from "../models/User";
import { Unit } from "../models/Unit";
import { Asset } from "../models/Asset";
import { ASSET_TYPES, type AssetType } from "../constants/assetTypes";

type Context = {
    userId?: string;
};

type RegisterArgs = {
    name: string;
    email: string;
    password: string;
};

type LoginArgs = {
    email: string;
    password: string;
};

type CreateAssetArgs = {
    name: string;
    serialNumber: string;
    note?: string;
    price: number;
    type: string;
    unitId: string;
};

type UpdateAssetArgs = {
    id: string;
    name?: string;
    serialNumber?: string;
    note?: string;
    price?: number;
    type?: string;
    unitId?: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const requireNonBlank = (value: string, fieldName: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        throw new Error(`${fieldName} is required`);
    }

    return trimmedValue;
};

const requireValidEmail = (email: string) => {
    const normalizedEmail = normalizeEmail(requireNonBlank(email, "Email"));

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new Error("Invalid email");
    }

    return normalizedEmail;
};

const requireValidPrice = (price: number) => {
    if (!Number.isFinite(price) || price < 0) {
        throw new Error("Price must be a non-negative number");
    }

    return price;
};

const requireValidAssetType = (type: string) => {
    if (!ASSET_TYPES.includes(type as AssetType)) {
        throw new Error("Invalid asset type");
    }

    return type as AssetType;
};

const requireAuth = (context: Context) => {
    if (!context.userId) {
        throw new Error("Not authorized");
    }

    return context.userId;
};

const createToken = (userId: string) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is required");
    }

    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

export const resolvers = {
    Asset: {
        unit: async (parent: { unit: string }) => {
            return await Unit.findById(parent.unit);
        },
    },

    Query: {
        me: async (_: unknown, __: unknown, context: Context) => {
            if (!context.userId) return null;

            return await User.findById(context.userId);
        },

        units: async (_: unknown, __: unknown, context: Context) => {
            const userId = requireAuth(context);

            return await Unit.find({ user: userId }).sort({ createdAt: -1 });
        },

        unit: async (_: unknown, { id }: { id: string }, context: Context) => {
            const userId = requireAuth(context);

            return await Unit.findOne({
                _id: id,
                user: userId,
            });
        },

        assets: async (_: unknown, __: unknown, context: Context) => {
            const userId = requireAuth(context);

            return await Asset.find({ user: userId })
                .populate("unit")
                .sort({ createdAt: -1 });
        },

        asset: async (_: unknown, { id }: { id: string }, context: Context) => {
            const userId = requireAuth(context);

            return await Asset.findOne({
                _id: id,
                user: userId,
            }).populate("unit");
        },

        assetsByUnit: async (
            _: unknown,
            { unitId }: { unitId: string },
            context: Context
        ) => {
            const userId = requireAuth(context);

            return await Asset.find({
                unit: unitId,
                user: userId,
            })
                .populate("unit")
                .sort({ createdAt: -1 });
        },
    },

    Mutation: {
        register: async (_: unknown, args: RegisterArgs) => {
            const name = requireNonBlank(args.name, "Name");
            const email = requireValidEmail(args.email);
            const password = requireNonBlank(args.password, "Password");

            if (password.length < 6) {
                throw new Error("Password must be at least 6 characters");
            }

            const existingUser = await User.findOne({ email });

            if (existingUser) {
                throw new Error("User with this email already exists");
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await User.create({
                name,
                email,
                password: hashedPassword,
            });

            const token = createToken(user._id.toString());

            return { token, user };
        },

        login: async (_: unknown, args: LoginArgs) => {
            const email = requireValidEmail(args.email);
            const password = requireNonBlank(args.password, "Password");

            const user = await User.findOne({ email });

            if (!user) {
                throw new Error("Invalid email or password");
            }

            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );

            if (!isPasswordValid) {
                throw new Error("Invalid email or password");
            }

            const token = createToken(user._id.toString());

            return { token, user };
        },

        createUnit: async (
            _: unknown,
            { name }: { name: string },
            context: Context
        ) => {
            const userId = requireAuth(context);
            const trimmedName = requireNonBlank(name, "Unit name");

            return await Unit.create({
                name: trimmedName,
                user: userId,
            });
        },

        updateUnit: async (
            _: unknown,
            { id, name }: { id: string; name: string },
            context: Context
        ) => {
            const userId = requireAuth(context);
            const trimmedName = requireNonBlank(name, "Unit name");

            const unit = await Unit.findOneAndUpdate(
                {
                    _id: id,
                    user: userId,
                },
                {
                    name: trimmedName,
                },
                {
                    new: true,
                }
            );

            if (!unit) {
                throw new Error("Unit not found");
            }

            return unit;
        },

        deleteUnit: async (
            _: unknown,
            { id }: { id: string },
            context: Context
        ) => {
            const userId = requireAuth(context);

            await Asset.deleteMany({
                unit: id,
                user: userId,
            });

            const result = await Unit.deleteOne({
                _id: id,
                user: userId,
            });

            return result.deletedCount === 1;
        },

        createAsset: async (
            _: unknown,
            args: CreateAssetArgs,
            context: Context
        ) => {
            const userId = requireAuth(context);
            const name = requireNonBlank(args.name, "Asset name");
            const serialNumber = requireNonBlank(
                args.serialNumber,
                "Serial number"
            );
            const note = args.note?.trim() ?? "";
            const price = requireValidPrice(args.price);
            const type = requireValidAssetType(args.type);
            const unitId = requireNonBlank(args.unitId, "Unit");

            const unit = await Unit.findOne({
                _id: unitId,
                user: userId,
            });

            if (!unit) {
                throw new Error("Unit not found");
            }

            return await Asset.create({
                name,
                serialNumber,
                note,
                price,
                type,
                unit: unitId,
                user: userId,
            });
        },

        updateAsset: async (
            _: unknown,
            args: UpdateAssetArgs,
            context: Context
        ) => {
            const userId = requireAuth(context);
            const changes = {
                ...(args.name !== undefined && {
                    name: requireNonBlank(args.name, "Asset name"),
                }),
                ...(args.serialNumber !== undefined && {
                    serialNumber: requireNonBlank(
                        args.serialNumber,
                        "Serial number"
                    ),
                }),
                ...(args.note !== undefined && { note: args.note.trim() }),
                ...(args.price !== undefined && {
                    price: requireValidPrice(args.price),
                }),
                ...(args.type !== undefined && {
                    type: requireValidAssetType(args.type),
                }),
                ...(args.unitId !== undefined && {
                    unit: requireNonBlank(args.unitId, "Unit"),
                }),
            };

            if (args.unitId) {
                const unit = await Unit.findOne({
                    _id: args.unitId,
                    user: userId,
                });

                if (!unit) {
                    throw new Error("Unit not found");
                }
            }

            const asset = await Asset.findOneAndUpdate(
                {
                    _id: args.id,
                    user: userId,
                },
                changes,
                {
                    new: true,
                }
            ).populate("unit");

            if (!asset) {
                throw new Error("Asset not found");
            }

            return asset;
        },

        deleteAsset: async (
            _: unknown,
            { id }: { id: string },
            context: Context
        ) => {
            const userId = requireAuth(context);

            const result = await Asset.deleteOne({
                _id: id,
                user: userId,
            });

            return result.deletedCount === 1;
        },
    },
};
