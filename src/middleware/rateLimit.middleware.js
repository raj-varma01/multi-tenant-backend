import { getRedisClient } from "../config/redis.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

export function authRateLimiter({ keyPrefix }) {
    return async (req, res, next) => {
        if (env.isTest) return next();

        try {
            const redis = getRedisClient();
            const tenantPart = req.headers["x-tenant-id"] || "no-tenant";
            const key = `ratelimit:${keyPrefix}:${tenantPart}:${req.ip}`;

            const count = await redis.incr(key);
            console.log('count ===>>>', count);
            if (count === 1) {
                await redis.expire(key, env.authRateLimitWindowSec);
            }

            if (count > env.authRateLimitMax) {
                throw new AppError("Too many requests, please try again later", 429);
            }

            next();
        } catch (err) {
            next(err);
        }
    };
}
