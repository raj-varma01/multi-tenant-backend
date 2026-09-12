import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";

import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";


export function createApp() {
    const app = express();

    app.use(helmet());
    app.use(cors({ origin: env.clientUrl, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());
    if (env.nodeEnv !== "test") {
        app.use(morgan("dev"));
    }

    app.get("/health", (req, res) => res.json({ status: "ok" }));

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
