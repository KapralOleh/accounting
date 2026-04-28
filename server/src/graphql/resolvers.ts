import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { User } from "../models/User";
import { Unit } from "../models/Unit";
import { Asset } from "../models/Asset";
import {
    ASSET_TYPES,
    RADIO_SUBTYPES,
    type AssetType,
    type RadioSubtype,
} from "../constants/assetTypes";

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

type AssetsPageArgs = {
    page?: number;
    limit?: number;
    unitId?: string;
    search?: string;
};

type CreateAssetArgs = {
    name: string;
    serialNumber: string;
    note?: string;
    price: number;
    type: string;
    radioSubtype?: string | null;
    unitId: string;
};

type UpdateAssetArgs = {
    id: string;
    name?: string;
    serialNumber?: string;
    note?: string;
    price?: number;
    type?: string;
    radioSubtype?: string | null;
    unitId?: string;
};

type AssetParent = {
    unit: string | Types.ObjectId | { _id?: unknown };
};

type TypeCountAggregate = {
    _id: AssetType;
    count: number;
};

type RadioSubtypeCountAggregate = {
    _id: RadioSubtype;
    count: number;
};

type UnitTypeCountAggregate = {
    _id: {
        unit: Types.ObjectId;
        type: AssetType;
        radioSubtype?: RadioSubtype | null;
    };
    count: number;
};

type DashboardUnit = {
    _id: {
        toString: () => string;
    };
    name: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const escapeRegExp = (value: string) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

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

const requireObjectId = (id: string, fieldName: string) => {
    const trimmedId = requireNonBlank(id, fieldName);

    if (
        !Types.ObjectId.isValid(trimmedId) ||
        new Types.ObjectId(trimmedId).toString() !== trimmedId
    ) {
        throw new Error(`${fieldName} is invalid`);
    }

    return trimmedId;
};

const clampPagination = (page?: number, limit?: number) => {
    const normalizedPage =
        Number.isInteger(page) && page !== undefined && page > 0 ? page : 1;
    const normalizedLimit =
        Number.isInteger(limit) && limit !== undefined && limit > 0
            ? Math.min(limit, 100)
            : 10;

    return {
        page: normalizedPage,
        limit: normalizedLimit,
        skip: (normalizedPage - 1) * normalizedLimit,
    };
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

const requireValidRadioSubtype = (radioSubtype: string) => {
    if (!RADIO_SUBTYPES.includes(radioSubtype as RadioSubtype)) {
        throw new Error("Invalid radio subtype");
    }

    return radioSubtype as RadioSubtype;
};

const resolveRadioSubtype = (
    type: AssetType,
    radioSubtype?: string | null
) => {
    if (type !== "RADIO") return undefined;

    return requireValidRadioSubtype(
        requireNonBlank(radioSubtype ?? "", "Radio subtype")
    );
};

const requireAuth = (context: Context) => {
    if (!context.userId || !Types.ObjectId.isValid(context.userId)) {
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

const buildCountsByType = (items: TypeCountAggregate[]) => {
    return new Map<AssetType, number>(
        items.map((item) => [item._id, item.count])
    );
};

const buildRadioSubtypeCounts = (
    items: RadioSubtypeCountAggregate[]
) => {
    return items.map((item) => ({
        subtype: item._id,
        count: item.count,
    }));
};

const buildUnitDashboardSummaries = (
    units: DashboardUnit[],
    byUnit: UnitTypeCountAggregate[]
) => {
    const groupedByUnit = new Map<string, UnitTypeCountAggregate[]>();

    byUnit.forEach((item) => {
        const unitId = item._id.unit.toString();
        const currentItems = groupedByUnit.get(unitId) ?? [];

        currentItems.push(item);
        groupedByUnit.set(unitId, currentItems);
    });

    return units.map((unit) => {
        const unitItems = groupedByUnit.get(unit._id.toString()) ?? [];
        const unitCountsByType = new Map<AssetType, number>();
        const radioCountsBySubtype = new Map<RadioSubtype, number>();

        unitItems.forEach((item) => {
            const { type, radioSubtype } = item._id;

            unitCountsByType.set(
                type,
                (unitCountsByType.get(type) ?? 0) + item.count
            );

            if (type === "RADIO" && radioSubtype) {
                radioCountsBySubtype.set(
                    radioSubtype,
                    (radioCountsBySubtype.get(radioSubtype) ?? 0) +
                        item.count
                );
            }
        });

        const total = unitItems.reduce((sum, item) => sum + item.count, 0);
        const starlinkCount = unitCountsByType.get("STARLINK") ?? 0;
        const laptopCount = unitCountsByType.get("LAPTOP") ?? 0;
        const radioCount = unitCountsByType.get("RADIO") ?? 0;

        return {
            unit,
            total,
            starlinkCount,
            laptopCount,
            radioCount,
            otherCount: total - starlinkCount - laptopCount - radioCount,
            radioBySubtype: Array.from(radioCountsBySubtype.entries()).map(
                ([subtype, count]) => ({
                    subtype,
                    count,
                })
            ),
        };
    });
};

export const resolvers = {
    Asset: {
        unit: async (parent: AssetParent) => {
            if (parent.unit instanceof Types.ObjectId) {
                return await Unit.findById(parent.unit);
            }

            if (
                typeof parent.unit === "object" &&
                parent.unit !== null &&
                "_id" in parent.unit
            ) {
                return parent.unit;
            }

            if (typeof parent.unit !== "string") {
                throw new Error("Unit is invalid");
            }

            const unitId = requireObjectId(parent.unit, "Unit");

            return await Unit.findById(unitId);
        },
    },

    Query: {
        me: async (_: unknown, __: unknown, context: Context) => {
            if (!context.userId) return null;

            const userId = requireAuth(context);

            return await User.findById(userId);
        },

        units: async (_: unknown, __: unknown, context: Context) => {
            const userId = requireAuth(context);

            return await Unit.find({ user: userId }).sort({ createdAt: -1 });
        },

        unit: async (_: unknown, { id }: { id: string }, context: Context) => {
            const userId = requireAuth(context);
            const unitId = requireObjectId(id, "Unit");

            return await Unit.findOne({
                _id: unitId,
                user: userId,
            });
        },

        assets: async (_: unknown, __: unknown, context: Context) => {
            const userId = requireAuth(context);

            return await Asset.find({ user: userId })
                .populate("unit")
                .sort({ createdAt: -1 });
        },

        assetsPage: async (
            _: unknown,
            args: AssetsPageArgs,
            context: Context
        ) => {
            const userId = requireAuth(context);
            const { page, limit, skip } = clampPagination(args.page, args.limit);
            const filter: Record<string, unknown> = {
                user: new Types.ObjectId(userId),
            };
            const search = args.search?.trim();

            if (args.unitId) {
                const unitId = requireObjectId(args.unitId, "Unit");
                const unit = await Unit.findOne({
                    _id: unitId,
                    user: userId,
                });

                if (!unit) {
                    throw new Error("Unit not found");
                }

                filter.unit = new Types.ObjectId(unitId);
            }

            if (search) {
                const searchRegex = new RegExp(escapeRegExp(search), "i");

                filter.$or = [
                    { name: searchRegex },
                    { serialNumber: searchRegex },
                    { note: searchRegex },
                    { radioSubtype: searchRegex },
                ];
            }

            const [items, total, totals] = await Promise.all([
                Asset.find(filter)
                    .populate("unit")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Asset.countDocuments(filter),
                Asset.aggregate([
                    { $match: filter },
                    {
                        $group: {
                            _id: null,
                            totalPrice: { $sum: "$price" },
                        },
                    },
                ]),
            ]);

            return {
                items,
                total,
                totalPrice: totals[0]?.totalPrice ?? 0,
                page,
                limit,
                totalPages: Math.max(Math.ceil(total / limit), 1),
            };
        },

        assetDashboardSummary: async (
            _: unknown,
            __: unknown,
            context: Context
        ) => {
            const userId = requireAuth(context);
            const userObjectId = new Types.ObjectId(userId);
            const [units, byType, radioBySubtype, byUnit] = await Promise.all([
                Unit.find({ user: userId })
                    .sort({ name: 1 })
                    .select("_id name")
                    .lean<DashboardUnit[]>()
                    .exec(),
                Asset.aggregate<TypeCountAggregate>([
                    { $match: { user: userObjectId } },
                    { $group: { _id: "$type", count: { $sum: 1 } } },
                ]).exec(),
                Asset.aggregate<RadioSubtypeCountAggregate>([
                    {
                        $match: {
                            user: userObjectId,
                            type: "RADIO",
                            radioSubtype: { $ne: null },
                        },
                    },
                    { $group: { _id: "$radioSubtype", count: { $sum: 1 } } },
                ]).exec(),
                Asset.aggregate<UnitTypeCountAggregate>([
                    { $match: { user: userObjectId } },
                    {
                        $group: {
                            _id: {
                                unit: "$unit",
                                type: "$type",
                                radioSubtype: "$radioSubtype",
                            },
                            count: { $sum: 1 },
                        },
                    },
                ]).exec(),
            ]);
            const countsByType = buildCountsByType(byType);
            const unitSummaries = buildUnitDashboardSummaries(units, byUnit);
            const total = byType.reduce(
                (sum, item) => sum + item.count,
                0
            );
            const starlinkCount = countsByType.get("STARLINK") ?? 0;
            const laptopCount = countsByType.get("LAPTOP") ?? 0;
            const radioCount = countsByType.get("RADIO") ?? 0;

            return {
                total,
                starlinkCount,
                laptopCount,
                radioCount,
                otherCount:
                    total - starlinkCount - laptopCount - radioCount,
                byType: byType.map((item) => ({
                    type: item._id,
                    count: item.count,
                })),
                radioBySubtype: buildRadioSubtypeCounts(radioBySubtype),
                byUnit: unitSummaries,
            };
        },

        asset: async (_: unknown, { id }: { id: string }, context: Context) => {
            const userId = requireAuth(context);
            const assetId = requireObjectId(id, "Asset");

            return await Asset.findOne({
                _id: assetId,
                user: userId,
            }).populate("unit");
        },

        assetsByUnit: async (
            _: unknown,
            { unitId }: { unitId: string },
            context: Context
        ) => {
            const userId = requireAuth(context);
            const validUnitId = requireObjectId(unitId, "Unit");

            const unit = await Unit.findOne({
                _id: validUnitId,
                user: userId,
            });

            if (!unit) {
                throw new Error("Unit not found");
            }

            return await Asset.find({
                unit: validUnitId,
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
            const unitId = requireObjectId(id, "Unit");
            const trimmedName = requireNonBlank(name, "Unit name");

            const unit = await Unit.findOneAndUpdate(
                {
                    _id: unitId,
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
            const unitId = requireObjectId(id, "Unit");

            await Asset.deleteMany({
                unit: unitId,
                user: userId,
            });

            const result = await Unit.deleteOne({
                _id: unitId,
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
            const radioSubtype = resolveRadioSubtype(
                type,
                args.radioSubtype
            );
            const unitId = requireObjectId(args.unitId, "Unit");

            const unit = await Unit.findOne({
                _id: unitId,
                user: userId,
            });

            if (!unit) {
                throw new Error("Unit not found");
            }

            const assetData = {
                name,
                serialNumber,
                note,
                price,
                type,
                unit: unitId,
                user: userId,
                ...(radioSubtype !== undefined && { radioSubtype }),
            };

            return await Asset.create(assetData);
        },

        updateAsset: async (
            _: unknown,
            args: UpdateAssetArgs,
            context: Context
        ) => {
            const userId = requireAuth(context);
            const assetId = requireObjectId(args.id, "Asset");
            const existingAsset = await Asset.findOne({
                _id: assetId,
                user: userId,
            });

            if (!existingAsset) {
                throw new Error("Asset not found");
            }

            const unitId =
                args.unitId !== undefined
                    ? requireObjectId(args.unitId, "Unit")
                    : undefined;
            const nextType =
                args.type !== undefined
                    ? requireValidAssetType(args.type)
                    : undefined;
            let radioSubtype: RadioSubtype | undefined;

            if (nextType !== undefined) {
                radioSubtype = resolveRadioSubtype(
                    nextType,
                    args.radioSubtype
                );
            } else if (args.radioSubtype !== undefined) {
                if (existingAsset.type !== "RADIO") {
                    throw new Error("Radio subtype is only allowed for radio assets");
                }

                radioSubtype = requireValidRadioSubtype(
                    requireNonBlank(
                        args.radioSubtype ?? "",
                        "Radio subtype"
                    )
                );
            }

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
                ...(nextType !== undefined && { type: nextType }),
                ...(radioSubtype !== undefined && { radioSubtype }),
                ...(unitId !== undefined && { unit: unitId }),
            };
            const update =
                nextType !== undefined && nextType !== "RADIO"
                    ? {
                          $set: changes,
                          $unset: { radioSubtype: "" },
                      }
                    : changes;

            if (unitId) {
                const unit = await Unit.findOne({
                    _id: unitId,
                    user: userId,
                });

                if (!unit) {
                    throw new Error("Unit not found");
                }
            }

            const asset = await Asset.findByIdAndUpdate(
                existingAsset._id,
                update,
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
            const assetId = requireObjectId(id, "Asset");

            const result = await Asset.deleteOne({
                _id: assetId,
                user: userId,
            });

            return result.deletedCount === 1;
        },
    },
};
