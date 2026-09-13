import Redis from "ioredis";
import { env } from "./env.js";

let client;

export function getRedisClient() {
    if (client) return client;

    client = new Redis({
        host: env.redisHost,
        port: env.redisPort,
        maxRetriesPerRequest: null,
    });

    client.on("error", (err) => {
        console.error("[redis] error:", err.message);
    });

    client.on("connect", () => {
        console.log(`[redis] connected -> ${env.redisHost}:${env.redisPort}`);
    });

    return client;
}

export const redisConnectionOptions = {
    host: env.redisHost,
    port: env.redisPort,
    maxRetriesPerRequest: null,
};
