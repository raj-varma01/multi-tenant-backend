import http from "http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { getRedisClient } from "./config/redis.js";
import { initSocket, subscribeToFileEvents } from "./socket/socket.js";

async function main() {
    await connectDB();
    console.log("[server] MongoDB ready");

    const redis = getRedisClient();
    await redis.ping();
    console.log("[server] Redis ready");

    const app = createApp();
    const httpServer = http.createServer(app);

    initSocket(httpServer);
    subscribeToFileEvents();

    httpServer.listen(env.port, () => {
        console.log(`[server] API listening on port ${env.port} (${env.nodeEnv})`);
    });
}

main().catch((err) => {
    console.error("[server] failed to start:", err.message);
    process.exit(1);
});
