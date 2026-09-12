import dotenv from "dotenv";

dotenv.config();

export const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "5000", 10),
    mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/saas_platform",
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    isTest: process.env.NODE_ENV === "test",
};
