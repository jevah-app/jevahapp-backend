"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = require("../controllers/location.controller");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.get("/locations", (0, asyncHandler_1.asyncHandler)(location_controller_1.getLocationSuggestions));
exports.default = router;
