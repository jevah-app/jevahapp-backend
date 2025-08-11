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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const blacklistedToken_model_1 = require("../models/blacklistedToken.model");
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
            success: false,
            message: "Unauthorized: No token provided",
        });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        // Check if token is blacklisted
        const isBlacklisted = yield blacklistedToken_model_1.BlacklistedToken.findOne({ token });
        if (isBlacklisted) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: Token has been invalidated",
            });
            return;
        }
        // Verify JWT
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        // Fetch user and attach full user to request
        const user = yield user_model_1.User.findById(decoded.userId).select("role isVerifiedCreator isVerifiedVendor isVerifiedChurch");
        if (!user) {
            res.status(401).json({ success: false, message: "User not found" });
            return;
        }
        // Attach the user object for role checks
        req.user = {
            role: user.role,
            isVerifiedCreator: user.isVerifiedCreator,
            isVerifiedVendor: user.isVerifiedVendor,
            isVerifiedChurch: user.isVerifiedChurch,
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid token",
            detail: error.message,
        });
    }
});
exports.verifyToken = verifyToken;
