"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchPurchase = exports.Subscription = exports.PaymentTransaction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Payment transaction schema
const paymentTransactionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reference: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        required: true,
        default: "USD",
    },
    paymentProcessor: {
        type: String,
        enum: ["paystack", "flutterwave", "paypal", "stripe"],
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "successful", "failed", "cancelled", "refunded"],
        default: "pending",
    },
    type: {
        type: String,
        enum: ["subscription", "merch_purchase"],
        required: true,
    },
    metadata: {
        subscriptionType: {
            type: String,
            enum: ["monthly", "yearly", "lifetime"],
        },
        merchItemId: String,
        artistId: mongoose_1.Schema.Types.ObjectId,
        quantity: Number,
        shippingAddress: {
            address: String,
            city: String,
            state: String,
            country: String,
            postalCode: String,
        },
    },
    processorReference: String,
    processorResponse: mongoose_1.Schema.Types.Mixed,
}, {
    timestamps: true,
});
// Subscription schema
const subscriptionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    subscriptionType: {
        type: String,
        enum: ["monthly", "yearly", "lifetime"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        required: true,
        default: "USD",
    },
    status: {
        type: String,
        enum: ["active", "cancelled", "expired", "pending"],
        default: "pending",
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    paymentTransaction: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "PaymentTransaction",
        required: true,
    },
    autoRenew: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Merch purchase schema
const merchPurchaseSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    artistId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    merchItemId: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        required: true,
        default: "USD",
    },
    status: {
        type: String,
        enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
        default: "pending",
    },
    paymentTransaction: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "PaymentTransaction",
        required: true,
    },
    shippingAddress: {
        address: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
    },
    trackingNumber: String,
}, {
    timestamps: true,
});
// Indexes for better performance
paymentTransactionSchema.index({ userId: 1, createdAt: -1 });
paymentTransactionSchema.index({ reference: 1 });
paymentTransactionSchema.index({ status: 1 });
paymentTransactionSchema.index({ paymentProcessor: 1 });
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });
merchPurchaseSchema.index({ userId: 1, createdAt: -1 });
merchPurchaseSchema.index({ artistId: 1, createdAt: -1 });
merchPurchaseSchema.index({ status: 1 });
// Export models
exports.PaymentTransaction = mongoose_1.default.models.PaymentTransaction ||
    mongoose_1.default.model("PaymentTransaction", paymentTransactionSchema);
exports.Subscription = mongoose_1.default.models.Subscription ||
    mongoose_1.default.model("Subscription", subscriptionSchema);
exports.MerchPurchase = mongoose_1.default.models.MerchPurchase ||
    mongoose_1.default.model("MerchPurchase", merchPurchaseSchema);
