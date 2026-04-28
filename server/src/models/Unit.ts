import mongoose, { Schema, Types } from "mongoose";

export type UnitDocument = {
    _id: Types.ObjectId;
    name: string;
    user: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};

const unitSchema = new Schema<UnitDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export const Unit = mongoose.model<UnitDocument>("Unit", unitSchema);