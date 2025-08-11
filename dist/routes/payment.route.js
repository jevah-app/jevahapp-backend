"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
/**



 */
router.post("/subscription/initialize", auth_middleware_1.verifyToken, rateLimiter_1.mediaInteractionRateLimiter, payment_controller_1.initializeSubscription);
/**



 */
router.post("/subscription/verify", auth_middleware_1.verifyToken, rateLimiter_1.mediaInteractionRateLimiter, payment_controller_1.verifySubscriptionPayment);
/**



 */
router.post("/merch/initialize", auth_middleware_1.verifyToken, rateLimiter_1.mediaInteractionRateLimiter, payment_controller_1.initializeMerchPurchase);
/**



 */
router.post("/merch/verify", auth_middleware_1.verifyToken, rateLimiter_1.mediaInteractionRateLimiter, payment_controller_1.verifyMerchPurchase);
/**



 */
router.get("/history", auth_middleware_1.verifyToken, rateLimiter_1.apiRateLimiter, payment_controller_1.getUserPaymentHistory);
/**



 */
router.post("/subscription/cancel", auth_middleware_1.verifyToken, rateLimiter_1.mediaInteractionRateLimiter, payment_controller_1.cancelSubscription);
exports.default = router;
