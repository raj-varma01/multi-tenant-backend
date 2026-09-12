import http from "http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

async function main() {
    await connectDB();
    console.log("[server] MongoDB ready");

    const app = createApp();
    const httpServer = http.createServer(app);

    httpServer.listen(env.port, () => {
        console.log(`API listening on port ${env.port} (${env.nodeEnv})`);
    });
}

main().catch((err) => {
    console.error("[server] failed to start:", err.message);
    process.exit(1);
});
