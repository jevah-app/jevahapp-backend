import { Router } from "express";
import {
  initializeSubscription,
  verifySubscriptionPayment,
  initializeMerchPurchase,
  verifyMerchPurchase,
  getUserPaymentHistory,
  cancelSubscription,
} from "../controllers/payment.controller";
import { verifyToken } from "../middleware/auth.middleware";
import {
  apiRateLimiter,
  mediaInteractionRateLimiter,
} from "../middleware/rateLimiter";

const router = Router();

/**



 */
router.post(
  "/subscription/initialize",
  verifyToken,
  mediaInteractionRateLimiter,
  initializeSubscription
);

/**



 */
router.post(
  "/subscription/verify",
  verifyToken,
  mediaInteractionRateLimiter,
  verifySubscriptionPayment
);

/**



 */
router.post(
  "/merch/initialize",
  verifyToken,
  mediaInteractionRateLimiter,
  initializeMerchPurchase
);

/**



 */
router.post(
  "/merch/verify",
  verifyToken,
  mediaInteractionRateLimiter,
  verifyMerchPurchase
);

/**



 */
router.get("/history", verifyToken, apiRateLimiter, getUserPaymentHistory);

/**



 */
router.post(
  "/subscription/cancel",
  verifyToken,
  mediaInteractionRateLimiter,
  cancelSubscription
);

export default router;
