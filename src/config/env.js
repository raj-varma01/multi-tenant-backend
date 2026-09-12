import dotenv from "dotenv";

dotenv.config();

export const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "5000", 10),
    mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/saas_platform",
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    isTest: process.env.NODE_ENV === "test",
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "dev_access_secret",
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret",
    inviteTokenSecret: process.env.INVITE_TOKEN_SECRET || "dev_invite_secret",
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    refreshTokenExpiresInMs: parseInt(
        process.env.REFRESH_TOKEN_EXPIRES_IN_MS || `${7 * 24 * 60 * 60 * 1000}`,
        10
    )
};
