import mongoose from "mongoose";
import { env } from "./env.js";

let connected = false;

export async function connectDB(uri = env.mongoUri) {
    if (connected) return mongoose.connection;

    mongoose.set("strictQuery", true);

    try {
        await mongoose.connect(uri);
        connected = true;
        console.log(`db connected -> ${mongoose.connection.name}`);
    } catch (err) {
        console.error("db connection failed:", err.message);
        throw err;
    }

    return mongoose.connection;
}

export async function disconnectDB() {
    if (!connected) return;
    await mongoose.disconnect();
    connected = false;
}
