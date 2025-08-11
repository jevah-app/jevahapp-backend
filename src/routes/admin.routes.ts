import { Router } from "express";
import { getAllUsers, updateUserRole } from "../controllers/admin.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

router.get("/users", verifyToken, requireAdmin, getAllUsers);
router.patch("/users/:id", verifyToken, requireAdmin, updateUserRole);

export default router;
