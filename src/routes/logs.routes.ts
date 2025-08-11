import { Router } from "express";
import { viewAuditLogs } from "../controllers/logs.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

router.get("/logs", verifyToken, requireAdmin, viewAuditLogs);

export default router;
