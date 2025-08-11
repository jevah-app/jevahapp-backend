import { Router } from "express";
import {
  createDevotional,
  listDevotionals,
} from "../controllers/devotionals.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { requireAdminOrCreator } from "../middleware/role.middleware";

const router = Router();

// Create a new devotional (admin or creator only)
router.post(
  "/create-devotional",
  verifyToken,
  requireAdminOrCreator,
  createDevotional
);

// List all devotionals (authenticated users)
router.get("/devotionals", verifyToken, listDevotionals);

export default router;
