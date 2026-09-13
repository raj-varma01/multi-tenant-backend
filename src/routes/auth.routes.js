import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/register", authRateLimiter({ keyPrefix: "register" }), authController.register);

router.post("/login", authRateLimiter({ keyPrefix: "login" }), authController.login);

router.post("/refresh", authRateLimiter({ keyPrefix: "refresh" }), authController.refresh);

router.post("/logout", authenticate, authController.logout);

export default router;
