"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const devotionals_controller_1 = require("../controllers/devotionals.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
// Create a new devotional (admin or creator only)
router.post("/create-devotional", auth_middleware_1.verifyToken, role_middleware_1.requireAdminOrCreator, devotionals_controller_1.createDevotional);
// List all devotionals (authenticated users)
router.get("/devotionals", auth_middleware_1.verifyToken, devotionals_controller_1.listDevotionals);
exports.default = router;
