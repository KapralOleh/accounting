import mongoose, { Schema, Types } from "mongoose";

import { ASSET_TYPES, type AssetType } from "../constants/assetTypes";

export type AssetDocument = {
    _id: Types.ObjectId;
    name: string;
    serialNumber: string;
    note?: string;
    price: number;
    type: AssetType;
    unit: Types.ObjectId;
    user: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};

const assetSchema = new Schema<AssetDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        serialNumber: {
            type: String,
            required: true,
            trim: true,
        },

        note: {
            type: String,
            default: "",
            trim: true,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        type: {
            type: String,
            enum: ASSET_TYPES,
            required: true,
        },

        unit: {
            type: Schema.Types.ObjectId,
            ref: "Unit",
            required: true,
        },

        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export const Asset = mongoose.model<AssetDocument>("Asset", assetSchema);