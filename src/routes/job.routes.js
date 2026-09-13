import { Router } from "express";
import * as jobController from "../controllers/job.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.get("/:id/retry", authenticate, tenantMiddleware, requireRole("owner", "admin"), jobController.retryFailedJob);

export default router;