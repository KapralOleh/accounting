import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.resolve(__dirname, "../../.env"),
});

export const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;

        if (!uri) {
            throw new Error("MONGO_URI is required");
        }

        await mongoose.connect(uri);

        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB error:", error);
        process.exit(1);
    }
};
