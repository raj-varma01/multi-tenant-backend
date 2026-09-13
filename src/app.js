import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import fileRoutes from "./routes/file.routes.js";
import reportRoutes from "./routes/report.routes.js";
import jobRoutes from "./routes/job.routes.js";
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

    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/users", userRoutes);
    app.use("/api/v1/files", fileRoutes);
    app.use("/api/v1/reports", reportRoutes);
    app.use("/api/v1/jobs", jobRoutes);



    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
