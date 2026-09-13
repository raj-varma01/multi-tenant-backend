import { Router } from "express";
import * as fileController from "../controllers/file.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
// import { uploadSingleFile, handleUploadErrors } from "../middleware/upload.middleware.js";

const router = Router();

router.use(authenticate, tenantMiddleware);

// router.post(
//     "/upload",
//     requireRole("owner", "admin", "editor"),
//     uploadSingleFile,
//     handleUploadErrors,
//     fileController.uploadFile
// );

router.get("/", requireRole("owner", "admin", "editor", "viewer"), fileController.listFiles);

export default router;
