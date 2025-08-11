import { Router } from "express";
import { getBookmarkedMedia } from "../controllers/bookmarks.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/get-bookmarked-media", verifyToken, getBookmarkedMedia);

export default router;
