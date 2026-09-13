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
    ),
    redisHost: process.env.REDIS_HOST || "localhost",
    redisPort: parseInt(process.env.REDIS_PORT || "6379", 10),
    awsRegion: process.env.AWS_REGION || "us-east-1",
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
    s3Bucket: process.env.S3_BUCKET || "saas-files",
    s3Endpoint: process.env.S3_ENDPOINT || "http://localhost:4566",
    s3ForcePathStyle: (process.env.S3_FORCE_PATH_STYLE || "true") === "true",
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || "20", 10),
    authRateLimitWindowSec: parseInt(
        process.env.AUTH_RATE_LIMIT_WINDOW_SEC || "60",
        10
    ),
    isTest: process.env.NODE_ENV === "test",
};
