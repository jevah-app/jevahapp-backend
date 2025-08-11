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
exports.cancelSubscription = exports.getUserPaymentHistory = exports.verifyMerchPurchase = exports.initializeMerchPurchase = exports.verifySubscriptionPayment = exports.initializeSubscription = void 0;
const payment_config_1 = require("../config/payment.config");
const payment_model_1 = require("../models/payment.model");
const user_model_1 = require("../models/user.model");
const mongoose_1 = require("mongoose");
const audit_service_1 = require("../service/audit.service");
const email_config_1 = require("../config/email.config");
// Initialize subscription payment
const initializeSubscription = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { subscriptionType, paymentProcessor, amount, currency } = request.body;
        const userId = request.userId;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        // Validate inputs
        if (!subscriptionType || !paymentProcessor || !amount || !currency) {
            response.status(400).json({
                success: false,
                message: "All payment details are required",
            });
            return;
        }
        if (amount <= 0) {
            response.status(400).json({
                success: false,
                message: "Amount must be greater than 0",
            });
            return;
        }
        // Get user details
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            response.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        // Generate unique reference
        const reference = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Calculate subscription end date
        const startDate = new Date();
        let endDate;
        switch (subscriptionType) {
            case "monthly":
                endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                break;
            case "yearly":
                endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
                break;
            case "lifetime":
                endDate = new Date(startDate.getTime() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
                break;
            default:
                response.status(400).json({
                    success: false,
                    message: "Invalid subscription type",
                });
                return;
        }
        // Create payment transaction record
        const paymentTransaction = yield payment_model_1.PaymentTransaction.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            reference,
            amount,
            currency,
            paymentProcessor,
            status: "pending",
            type: "subscription",
            metadata: {
                subscriptionType,
                startDate,
                endDate,
            },
        });
        // Initialize payment with processor
        const paymentResult = yield payment_config_1.PaymentService.initializePayment(paymentProcessor, {
            amount,
            currency,
            email: user.email,
            reference,
            callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
            metadata: {
                userId,
                subscriptionType,
                transactionId: paymentTransaction._id.toString(),
            },
        });
        if (!paymentResult.success) {
            response.status(400).json({
                success: false,
                message: paymentResult.error || "Payment initialization failed",
            });
            return;
        }
        // Log payment activity
        yield audit_service_1.AuditService.logPaymentActivity(userId, "subscription_purchase", amount, currency, paymentProcessor, true, { subscriptionType, reference }, request.ip, request.get("User-Agent"));
        response.status(200).json({
            success: true,
            message: "Payment initialized successfully",
            data: {
                reference,
                paymentUrl: paymentResult.authorization_url ||
                    paymentResult.payment_url ||
                    paymentResult.checkout_url,
                accessCode: paymentResult.access_code,
            },
        });
    }
    catch (error) {
        console.error("Initialize subscription error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to initialize subscription payment",
        });
    }
});
exports.initializeSubscription = initializeSubscription;
// Verify subscription payment
const verifySubscriptionPayment = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reference, paymentProcessor } = request.body;
        const userId = request.userId;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!reference || !paymentProcessor) {
            response.status(400).json({
                success: false,
                message: "Reference and payment processor are required",
            });
            return;
        }
        // Find payment transaction
        const paymentTransaction = yield payment_model_1.PaymentTransaction.findOne({
            reference,
            userId: new mongoose_1.Types.ObjectId(userId),
            type: "subscription",
        });
        if (!paymentTransaction) {
            response.status(404).json({
                success: false,
                message: "Payment transaction not found",
            });
            return;
        }
        // Verify payment with processor
        const verificationResult = yield payment_config_1.PaymentService.verifyPayment(paymentProcessor, reference);
        if (verificationResult.success) {
            // Update payment transaction
            yield payment_model_1.PaymentTransaction.findByIdAndUpdate(paymentTransaction._id, {
                status: "successful",
                processorReference: reference,
                processorResponse: verificationResult,
            });
            // Create subscription
            const subscription = yield payment_model_1.Subscription.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                subscriptionType: paymentTransaction.metadata.subscriptionType,
                amount: paymentTransaction.amount,
                currency: paymentTransaction.currency,
                status: "active",
                startDate: paymentTransaction.metadata.startDate,
                endDate: paymentTransaction.metadata.endDate,
                paymentTransaction: paymentTransaction._id,
                autoRenew: true,
            });
            // Update user subscription
            yield user_model_1.User.findByIdAndUpdate(userId, {
                subscriptionTier: "premium",
                subscriptionStatus: "active",
                subscriptionEndDate: paymentTransaction.metadata.endDate,
            });
            // Send confirmation email
            const user = yield user_model_1.User.findById(userId);
            if (user && user.email) {
                try {
                    yield email_config_1.EmailService.sendEmail(user.email, {
                        subject: "Subscription Confirmed - Jevah",
                        html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4CAF50;">🎉 Subscription Confirmed!</h2>
                <p>Hello ${user.firstName || "there"},</p>
                <p>Your ${paymentTransaction.metadata.subscriptionType} subscription has been successfully activated!</p>
                <p><strong>Subscription Details:</strong></p>
                <ul>
                  <li>Type: ${paymentTransaction.metadata.subscriptionType}</li>
                  <li>Amount: ${paymentTransaction.currency} ${paymentTransaction.amount}</li>
                  <li>Start Date: ${new Date(paymentTransaction.metadata.startDate).toLocaleDateString()}</li>
                  <li>End Date: ${new Date(paymentTransaction.metadata.endDate).toLocaleDateString()}</li>
                </ul>
                <p>You now have access to all premium features!</p>
                <br>
                <p>Best regards,<br>The Jevah Team</p>
              </div>
            `,
                        text: `Your ${paymentTransaction.metadata.subscriptionType} subscription has been successfully activated!`,
                    });
                }
                catch (emailError) {
                    console.error("Failed to send subscription confirmation email:", emailError);
                }
            }
            response.status(200).json({
                success: true,
                message: "Subscription payment verified successfully",
                data: {
                    subscription,
                    paymentTransaction,
                },
            });
        }
        else {
            // Update payment transaction as failed
            yield payment_model_1.PaymentTransaction.findByIdAndUpdate(paymentTransaction._id, {
                status: "failed",
                processorResponse: verificationResult,
            });
            response.status(400).json({
                success: false,
                message: verificationResult.error || "Payment verification failed",
            });
        }
    }
    catch (error) {
        console.error("Verify subscription payment error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to verify subscription payment",
        });
    }
});
exports.verifySubscriptionPayment = verifySubscriptionPayment;
// Initialize merch purchase payment
const initializeMerchPurchase = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { artistId, merchItemId, quantity, paymentProcessor, amount, currency, shippingAddress, } = request.body;
        const userId = request.userId;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        // Validate inputs
        if (!artistId ||
            !merchItemId ||
            !quantity ||
            !paymentProcessor ||
            !amount ||
            !currency) {
            response.status(400).json({
                success: false,
                message: "All purchase details are required",
            });
            return;
        }
        if (quantity <= 0 || amount <= 0) {
            response.status(400).json({
                success: false,
                message: "Quantity and amount must be greater than 0",
            });
            return;
        }
        // Get user details
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            response.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        // Generate unique reference
        const reference = `merch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Create payment transaction record
        const paymentTransaction = yield payment_model_1.PaymentTransaction.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            reference,
            amount,
            currency,
            paymentProcessor,
            status: "pending",
            type: "merch_purchase",
            metadata: {
                artistId,
                merchItemId,
                quantity,
                shippingAddress,
            },
        });
        // Initialize payment with processor
        const paymentResult = yield payment_config_1.PaymentService.initializePayment(paymentProcessor, {
            amount,
            currency,
            email: user.email,
            reference,
            callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
            metadata: {
                userId,
                artistId,
                merchItemId,
                quantity,
                transactionId: paymentTransaction._id.toString(),
            },
        });
        if (!paymentResult.success) {
            response.status(400).json({
                success: false,
                message: paymentResult.error || "Payment initialization failed",
            });
            return;
        }
        // Log payment activity
        yield audit_service_1.AuditService.logPaymentActivity(userId, "merch_purchase", amount, currency, paymentProcessor, true, { artistId, merchItemId, quantity, reference }, request.ip, request.get("User-Agent"));
        response.status(200).json({
            success: true,
            message: "Merch purchase payment initialized successfully",
            data: {
                reference,
                paymentUrl: paymentResult.authorization_url ||
                    paymentResult.payment_url ||
                    paymentResult.checkout_url,
                accessCode: paymentResult.access_code,
            },
        });
    }
    catch (error) {
        console.error("Initialize merch purchase error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to initialize merch purchase payment",
        });
    }
});
exports.initializeMerchPurchase = initializeMerchPurchase;
// Verify merch purchase payment
const verifyMerchPurchase = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reference, paymentProcessor } = request.body;
        const userId = request.userId;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!reference || !paymentProcessor) {
            response.status(400).json({
                success: false,
                message: "Reference and payment processor are required",
            });
            return;
        }
        // Find payment transaction
        const paymentTransaction = yield payment_model_1.PaymentTransaction.findOne({
            reference,
            userId: new mongoose_1.Types.ObjectId(userId),
            type: "merch_purchase",
        });
        if (!paymentTransaction) {
            response.status(404).json({
                success: false,
                message: "Payment transaction not found",
            });
            return;
        }
        // Verify payment with processor
        const verificationResult = yield payment_config_1.PaymentService.verifyPayment(paymentProcessor, reference);
        if (verificationResult.success) {
            // Update payment transaction
            yield payment_model_1.PaymentTransaction.findByIdAndUpdate(paymentTransaction._id, {
                status: "successful",
                processorReference: reference,
                processorResponse: verificationResult,
            });
            // Create merch purchase record
            const merchPurchase = yield payment_model_1.MerchPurchase.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                artistId: new mongoose_1.Types.ObjectId(paymentTransaction.metadata.artistId),
                merchItemId: paymentTransaction.metadata.merchItemId,
                quantity: paymentTransaction.metadata.quantity,
                amount: paymentTransaction.amount,
                currency: paymentTransaction.currency,
                status: "paid",
                paymentTransaction: paymentTransaction._id,
                shippingAddress: paymentTransaction.metadata.shippingAddress,
            });
            // Update artist's merch stock
            yield user_model_1.User.updateOne({
                _id: paymentTransaction.metadata.artistId,
                "merchItems.id": paymentTransaction.metadata.merchItemId,
            }, {
                $inc: {
                    "merchItems.$.stockCount": -paymentTransaction.metadata.quantity,
                },
            });
            // Send confirmation email to customer
            const user = yield user_model_1.User.findById(userId);
            if (user && user.email) {
                try {
                    yield email_config_1.EmailService.sendEmail(user.email, {
                        subject: "Merch Purchase Confirmed - Jevah",
                        html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4CAF50;">🛍️ Purchase Confirmed!</h2>
                <p>Hello ${user.firstName || "there"},</p>
                <p>Your merch purchase has been confirmed!</p>
                <p><strong>Order Details:</strong></p>
                <ul>
                  <li>Item ID: ${paymentTransaction.metadata.merchItemId}</li>
                  <li>Quantity: ${paymentTransaction.metadata.quantity}</li>
                  <li>Amount: ${paymentTransaction.currency} ${paymentTransaction.amount}</li>
                  <li>Order ID: ${merchPurchase._id}</li>
                </ul>
                <p>We'll notify you when your order ships!</p>
                <br>
                <p>Best regards,<br>The Jevah Team</p>
              </div>
            `,
                        text: `Your merch purchase has been confirmed! Order ID: ${merchPurchase._id}`,
                    });
                }
                catch (emailError) {
                    console.error("Failed to send merch purchase confirmation email:", emailError);
                }
            }
            response.status(200).json({
                success: true,
                message: "Merch purchase payment verified successfully",
                data: {
                    merchPurchase,
                    paymentTransaction,
                },
            });
        }
        else {
            // Update payment transaction as failed
            yield payment_model_1.PaymentTransaction.findByIdAndUpdate(paymentTransaction._id, {
                status: "failed",
                processorResponse: verificationResult,
            });
            response.status(400).json({
                success: false,
                message: verificationResult.error || "Payment verification failed",
            });
        }
    }
    catch (error) {
        console.error("Verify merch purchase error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to verify merch purchase payment",
        });
    }
});
exports.verifyMerchPurchase = verifyMerchPurchase;
// Get user's payment history
const getUserPaymentHistory = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 20;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const skip = (page - 1) * limit;
        const payments = yield payment_model_1.PaymentTransaction.find({
            userId: new mongoose_1.Types.ObjectId(userId),
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = yield payment_model_1.PaymentTransaction.countDocuments({
            userId: new mongoose_1.Types.ObjectId(userId),
        });
        response.status(200).json({
            success: true,
            data: {
                payments,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    }
    catch (error) {
        console.error("Get user payment history error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to get payment history",
        });
    }
});
exports.getUserPaymentHistory = getUserPaymentHistory;
// Cancel subscription
const cancelSubscription = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        // Find active subscription
        const subscription = yield payment_model_1.Subscription.findOne({
            userId: new mongoose_1.Types.ObjectId(userId),
            status: "active",
        });
        if (!subscription) {
            response.status(404).json({
                success: false,
                message: "No active subscription found",
            });
            return;
        }
        // Update subscription status
        yield payment_model_1.Subscription.findByIdAndUpdate(subscription._id, {
            status: "cancelled",
            autoRenew: false,
        });
        // Update user subscription
        yield user_model_1.User.findByIdAndUpdate(userId, {
            subscriptionStatus: "cancelled",
        });
        // Log activity
        yield audit_service_1.AuditService.logActivity({
            userId,
            action: "subscription_cancel",
            resourceType: "subscription",
            resourceId: subscription._id.toString(),
            timestamp: new Date(),
        });
        response.status(200).json({
            success: true,
            message: "Subscription cancelled successfully",
        });
    }
    catch (error) {
        console.error("Cancel subscription error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to cancel subscription",
        });
    }
});
exports.cancelSubscription = cancelSubscription;
