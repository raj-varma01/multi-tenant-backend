import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate, tenantMiddleware);

router.get("/", requireRole("owner", "admin"), userController.listUsers);
router.post("/invite", requireRole("owner", "admin"), userController.inviteUser);
router.patch("/:id/role", requireRole("owner"), userController.changeUserRole);

export default router;
