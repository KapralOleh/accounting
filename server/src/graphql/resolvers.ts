import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User } from "../models/User";
import { Unit } from "../models/Unit";
import { Asset } from "../models/Asset";

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

const requireAuth = (context: Context) => {
    if (!context.userId) {
        throw new Error("Not authorized");
    }

    return context.userId;
};

const createToken = (userId: string) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET as string,
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
            const existingUser = await User.findOne({ email: args.email });

            if (existingUser) {
                throw new Error("User with this email already exists");
            }

            const hashedPassword = await bcrypt.hash(args.password, 10);

            const user = await User.create({
                name: args.name,
                email: args.email,
                password: hashedPassword,
            });

            const token = createToken(user._id.toString());

            return { token, user };
        },

        login: async (_: unknown, args: LoginArgs) => {
            const user = await User.findOne({ email: args.email });

            if (!user) {
                throw new Error("Invalid email or password");
            }

            const isPasswordValid = await bcrypt.compare(
                args.password,
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

            return await Unit.create({
                name,
                user: userId,
            });
        },

        updateUnit: async (
            _: unknown,
            { id, name }: { id: string; name: string },
            context: Context
        ) => {
            const userId = requireAuth(context);

            const unit = await Unit.findOneAndUpdate(
                {
                    _id: id,
                    user: userId,
                },
                {
                    name,
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

            const unit = await Unit.findOne({
                _id: args.unitId,
                user: userId,
            });

            if (!unit) {
                throw new Error("Unit not found");
            }

            return await Asset.create({
                name: args.name,
                serialNumber: args.serialNumber,
                note: args.note ?? "",
                price: args.price,
                type: args.type,
                unit: args.unitId,
                user: userId,
            });
        },

        updateAsset: async (
            _: unknown,
            args: UpdateAssetArgs,
            context: Context
        ) => {
            const userId = requireAuth(context);

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
                {
                    ...(args.name !== undefined && { name: args.name }),
                    ...(args.serialNumber !== undefined && {
                        serialNumber: args.serialNumber,
                    }),
                    ...(args.note !== undefined && { note: args.note }),
                    ...(args.price !== undefined && { price: args.price }),
                    ...(args.type !== undefined && { type: args.type }),
                    ...(args.unitId !== undefined && { unit: args.unitId }),
                },
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