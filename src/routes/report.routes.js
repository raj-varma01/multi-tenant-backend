import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.get("/summary", authenticate, tenantMiddleware, requireRole("owner", "admin"), reportController.getSummary);

export default router;
