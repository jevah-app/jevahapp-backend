"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookmarks_controller_1 = require("../controllers/bookmarks.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/get-bookmarked-media", auth_middleware_1.verifyToken, bookmarks_controller_1.getBookmarkedMedia);
exports.default = router;
