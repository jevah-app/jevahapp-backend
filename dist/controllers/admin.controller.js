"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.getAllUsers = void 0;
const user_model_1 = require("../models/user.model");
/**
 * Get all users (admin only)
 */
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_model_1.User.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            users,
        });
    }
    catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
});
exports.getAllUsers = getAllUsers;
/**
 * Update a user's role (admin only)
 */
const updateUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role) {
            res.status(400).json({ success: false, message: "Role is required" });
            return;
        }
        const user = yield user_model_1.User.findByIdAndUpdate(id, { role }, { new: true });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            user,
        });
    }
    catch (error) {
        console.error("Update role error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update user role",
        });
    }
});
exports.updateUserRole = updateUserRole;
