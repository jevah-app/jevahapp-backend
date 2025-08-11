"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const signToken = (payload) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const options = {
        expiresIn: (process.env.JWT_EXPIRES_IN ||
            "30d"),
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, options);
};
exports.signToken = signToken;
