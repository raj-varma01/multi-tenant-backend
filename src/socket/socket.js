import { Server } from "socket.io";
import Redis from "ioredis";
import { verifyAccessToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

let io;
const FILE_EVENTS_CHANNEL = "file-events";

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: { origin: env.clientUrl, credentials: true },
    });
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error("Missing auth token"));
            const payload = verifyAccessToken(token);
            socket.userId = payload.sub;
            next();
        } catch {
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        console.log('socket.id ===>>>', socket.id);
        socket.join(`user:${socket.userId}`);
        console.log(`[socket] user ${socket.userId} connected (${socket.id})`);

        socket.on("disconnect", () => {
            console.log(`[socket] user ${socket.userId} disconnected (${socket.id})`);
        });
    });

    return io;
}

export function getIO() {
    return io;
}

export function notifyUser(userId, event, payload) {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, payload);
}

export function subscribeToFileEvents() {
    const subscriber = new Redis({ host: env.redisHost, port: env.redisPort });
    subscriber.subscribe(FILE_EVENTS_CHANNEL);
    subscriber.on("message", (channel, message) => {
        if (channel !== FILE_EVENTS_CHANNEL) return;
        try {
            const { userId, event, payload } = JSON.parse(message);
            notifyUser(userId, event, payload);
        } catch (err) {
            console.error("[socket] failed to relay file event:", err.message);
        }
    });
    return subscriber;
}

export async function publishFileEvent({ userId, event, payload }) {
    const publisher = new Redis({ host: env.redisHost, port: env.redisPort });
    await publisher.publish(
        FILE_EVENTS_CHANNEL,
        JSON.stringify({ userId, event, payload })
    );
    await publisher.quit();
}
