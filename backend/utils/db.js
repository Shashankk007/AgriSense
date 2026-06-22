import mongoose from "mongoose";

export const connectDb = async () => {
    try {
        const URL = process.env.MONGO_URL || process.env.MONGODB_URI;

        if (!URL) {
            throw new Error("MONGO_URL or MONGODB_URI is not set in environment");
        }

        await mongoose.connect(URL);
        console.log("Database connected");
    } catch (err) {
        console.error("Database connection failed:", err?.message || err);
        console.error(err?.stack || "");
        process.exit(1);
    }
};

