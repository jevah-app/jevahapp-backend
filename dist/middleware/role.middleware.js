"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireVendor = exports.requireChurchAdmin = exports.requireAdminOrCreator = exports.requireContentCreator = exports.requireAdmin = void 0;
/**
 * Middleware to allow only users with the "admin" role.
 */
const requireAdmin = (request, response, next) => {
    var _a;
    if (((_a = request.user) === null || _a === void 0 ? void 0 : _a.role) === "admin") {
        return next();
    }
    response.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
    });
};
exports.requireAdmin = requireAdmin;
/**
 * Middleware to allow only verified content creators.
 */
const requireContentCreator = (request, response, next) => {
    var _a, _b;
    if (((_a = request.user) === null || _a === void 0 ? void 0 : _a.role) === "content_creator" &&
        ((_b = request.user) === null || _b === void 0 ? void 0 : _b.isVerifiedCreator) === true) {
        return next();
    }
    response.status(403).json({
        success: false,
        message: "Access denied. Verified content creators only.",
    });
};
exports.requireContentCreator = requireContentCreator;
/**
 * Middleware to allow either admins or verified content creators.
 */
const requireAdminOrCreator = (request, response, next) => {
    var _a, _b, _c;
    const isAdmin = ((_a = request.user) === null || _a === void 0 ? void 0 : _a.role) === "admin";
    const isCreator = ((_b = request.user) === null || _b === void 0 ? void 0 : _b.role) === "content_creator" &&
        ((_c = request.user) === null || _c === void 0 ? void 0 : _c.isVerifiedCreator) === true;
    if (isAdmin || isCreator) {
        return next();
    }
    response.status(403).json({
        success: false,
        message: "Access denied. Admins or verified content creators only.",
    });
};
exports.requireAdminOrCreator = requireAdminOrCreator;
/**
 * Middleware to allow only verified church admins.
 */
const requireChurchAdmin = (request, response, next) => {
    var _a, _b;
    if (((_a = request.user) === null || _a === void 0 ? void 0 : _a.role) === "church_admin" &&
        ((_b = request.user) === null || _b === void 0 ? void 0 : _b.isVerifiedChurch) === true) {
        return next();
    }
    response.status(403).json({
        success: false,
        message: "Access denied. Verified church admins only.",
    });
};
exports.requireChurchAdmin = requireChurchAdmin;
/**
 * Middleware to allow only verified vendors.
 */
const requireVendor = (request, response, next) => {
    var _a, _b;
    if (((_a = request.user) === null || _a === void 0 ? void 0 : _a.role) === "vendor" &&
        ((_b = request.user) === null || _b === void 0 ? void 0 : _b.isVerifiedVendor) === true) {
        return next();
    }
    response.status(403).json({
        success: false,
        message: "Access denied. Verified vendors only.",
    });
};
exports.requireVendor = requireVendor;
