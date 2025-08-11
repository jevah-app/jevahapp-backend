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
exports.viewAuditLogs = void 0;
const log_model_1 = require("../models/log.model");
const viewAuditLogs = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const logs = yield log_model_1.Log.find()
            .sort({ createdAt: -1 })
            .limit(200)
            .populate("performedBy", "email role");
        response.status(200).json({
            success: true,
            logs,
        });
    }
    catch (error) {
        console.error("Fetch logs error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to fetch audit logs",
        });
    }
});
exports.viewAuditLogs = viewAuditLogs;
