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
exports.PaymentService = exports.paymentConfig = void 0;
const axios_1 = __importDefault(require("axios"));
// Payment configuration
exports.paymentConfig = {
    paystack: {
        secretKey: process.env.PAYSTACK_SECRET_KEY || "",
        publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
        baseUrl: "https://api.paystack.co",
    },
    flutterwave: {
        secretKey: process.env.FLUTTERWAVE_SECRET_KEY || "",
        publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || "",
        baseUrl: "https://api.flutterwave.com/v3",
    },
    paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID || "",
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
        baseUrl: process.env.NODE_ENV === "production"
            ? "https://api-m.paypal.com"
            : "https://api-m.sandbox.paypal.com",
    },
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || "",
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    },
};
// Payment service class
class PaymentService {
    // Initialize payment with Paystack
    static initializePaystackPayment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield axios_1.default.post(`${exports.paymentConfig.paystack.baseUrl}/transaction/initialize`, {
                    amount: data.amount * 100, // Convert to kobo
                    email: data.email,
                    reference: data.reference,
                    callback_url: data.callback_url,
                    metadata: data.metadata,
                }, {
                    headers: {
                        Authorization: `Bearer ${exports.paymentConfig.paystack.secretKey}`,
                        "Content-Type": "application/json",
                    },
                });
                if (response.data.status) {
                    return {
                        success: true,
                        reference: response.data.data.reference,
                        authorization_url: response.data.data.authorization_url,
                        access_code: response.data.data.access_code,
                    };
                }
                else {
                    return {
                        success: false,
                        reference: data.reference,
                        error: response.data.message || "Payment initialization failed",
                    };
                }
            }
            catch (error) {
                return {
                    success: false,
                    reference: data.reference,
                    error: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Payment initialization failed",
                };
            }
        });
    }
    // Initialize payment with Flutterwave
    static initializeFlutterwavePayment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield axios_1.default.post(`${exports.paymentConfig.flutterwave.baseUrl}/payments`, {
                    tx_ref: data.reference,
                    amount: data.amount,
                    currency: data.currency,
                    redirect_url: data.callback_url,
                    customer: {
                        email: data.email,
                    },
                    customizations: {
                        title: "Jevah Payment",
                        description: "Payment for Jevah services",
                        logo: "https://jevahapp.com/logo.png",
                    },
                    meta: data.metadata,
                }, {
                    headers: {
                        Authorization: `Bearer ${exports.paymentConfig.flutterwave.secretKey}`,
                        "Content-Type": "application/json",
                    },
                });
                if (response.data.status === "success") {
                    return {
                        success: true,
                        reference: data.reference,
                        payment_url: response.data.data.link,
                    };
                }
                else {
                    return {
                        success: false,
                        reference: data.reference,
                        error: response.data.message || "Payment initialization failed",
                    };
                }
            }
            catch (error) {
                return {
                    success: false,
                    reference: data.reference,
                    error: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Payment initialization failed",
                };
            }
        });
    }
    // Initialize payment with PayPal
    static initializePayPalPayment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                // First, get access token
                const tokenResponse = yield axios_1.default.post(`${exports.paymentConfig.paypal.baseUrl}/v1/oauth2/token`, "grant_type=client_credentials", {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: `Basic ${Buffer.from(`${exports.paymentConfig.paypal.clientId}:${exports.paymentConfig.paypal.clientSecret}`).toString("base64")}`,
                    },
                });
                const accessToken = tokenResponse.data.access_token;
                // Create PayPal order
                const orderResponse = yield axios_1.default.post(`${exports.paymentConfig.paypal.baseUrl}/v2/checkout/orders`, {
                    intent: "CAPTURE",
                    purchase_units: [
                        {
                            reference_id: data.reference,
                            amount: {
                                currency_code: data.currency,
                                value: data.amount.toString(),
                            },
                            description: "Jevah Payment",
                            custom_id: data.reference,
                        },
                    ],
                    application_context: {
                        return_url: data.callback_url,
                        cancel_url: `${data.callback_url}?status=cancelled`,
                    },
                }, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                });
                if (orderResponse.data.id) {
                    return {
                        success: true,
                        reference: data.reference,
                        checkout_url: (_a = orderResponse.data.links.find((link) => link.rel === "approve")) === null || _a === void 0 ? void 0 : _a.href,
                    };
                }
                else {
                    return {
                        success: false,
                        reference: data.reference,
                        error: "PayPal order creation failed",
                    };
                }
            }
            catch (error) {
                return {
                    success: false,
                    reference: data.reference,
                    error: ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) ||
                        "PayPal payment initialization failed",
                };
            }
        });
    }
    // Initialize payment with Stripe
    static initializeStripePayment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stripe = require("stripe")(exports.paymentConfig.stripe.secretKey);
                const session = yield stripe.checkout.sessions.create({
                    payment_method_types: ["card"],
                    line_items: [
                        {
                            price_data: {
                                currency: data.currency.toLowerCase(),
                                product_data: {
                                    name: "Jevah Payment",
                                    description: "Payment for Jevah services",
                                },
                                unit_amount: Math.round(data.amount * 100), // Convert to cents
                            },
                            quantity: 1,
                        },
                    ],
                    mode: "payment",
                    success_url: `${data.callback_url}?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${data.callback_url}?status=cancelled`,
                    metadata: Object.assign({ reference: data.reference }, data.metadata),
                });
                return {
                    success: true,
                    reference: data.reference,
                    checkout_url: session.url,
                };
            }
            catch (error) {
                return {
                    success: false,
                    reference: data.reference,
                    error: error.message || "Stripe payment initialization failed",
                };
            }
        });
    }
    // Verify payment with Paystack
    static verifyPaystackPayment(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield axios_1.default.get(`${exports.paymentConfig.paystack.baseUrl}/transaction/verify/${reference}`, {
                    headers: {
                        Authorization: `Bearer ${exports.paymentConfig.paystack.secretKey}`,
                    },
                });
                if (response.data.status && response.data.data.status === "success") {
                    return {
                        success: true,
                        reference,
                    };
                }
                else {
                    return {
                        success: false,
                        reference,
                        error: "Payment verification failed",
                    };
                }
            }
            catch (error) {
                return {
                    success: false,
                    reference,
                    error: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Payment verification failed",
                };
            }
        });
    }
    // Verify payment with Flutterwave
    static verifyFlutterwavePayment(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield axios_1.default.get(`${exports.paymentConfig.flutterwave.baseUrl}/transactions/${reference}/verify`, {
                    headers: {
                        Authorization: `Bearer ${exports.paymentConfig.flutterwave.secretKey}`,
                    },
                });
                if (response.data.status === "success" &&
                    response.data.data.status === "successful") {
                    return {
                        success: true,
                        reference,
                    };
                }
                else {
                    return {
                        success: false,
                        reference,
                        error: "Payment verification failed",
                    };
                }
            }
            catch (error) {
                return {
                    success: false,
                    reference,
                    error: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Payment verification failed",
                };
            }
        });
    }
    // Verify payment with PayPal
    static verifyPayPalPayment(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // Get access token
                const tokenResponse = yield axios_1.default.post(`${exports.paymentConfig.paypal.baseUrl}/v1/oauth2/token`, "grant_type=client_credentials", {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: `Basic ${Buffer.from(`${exports.paymentConfig.paypal.clientId}:${exports.paymentConfig.paypal.clientSecret}`).toString("base64")}`,
                    },
                });
                const accessToken = tokenResponse.data.access_token;
                // Capture payment
                const captureResponse = yield axios_1.default.post(`${exports.paymentConfig.paypal.baseUrl}/v2/checkout/orders/${orderId}/capture`, {}, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                });
                if (captureResponse.data.status === "COMPLETED") {
                    return {
                        success: true,
                        reference: orderId,
                    };
                }
                else {
                    return {
                        success: false,
                        reference: orderId,
                        error: "Payment verification failed",
                    };
                }
            }
            catch (error) {
                return {
                    success: false,
                    reference: orderId,
                    error: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Payment verification failed",
                };
            }
        });
    }
    // Verify payment with Stripe
    static verifyStripePayment(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stripe = require("stripe")(exports.paymentConfig.stripe.secretKey);
                const session = yield stripe.checkout.sessions.retrieve(sessionId);
                if (session.payment_status === "paid") {
                    return {
                        success: true,
                        reference: session.metadata.reference,
                    };
                }
                else {
                    return {
                        success: false,
                        reference: session.metadata.reference,
                        error: "Payment verification failed",
                    };
                }
            }
            catch (error) {
                return {
                    success: false,
                    reference: sessionId,
                    error: error.message || "Payment verification failed",
                };
            }
        });
    }
    // Initialize payment based on processor
    static initializePayment(processor, data) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (processor) {
                case "paystack":
                    return this.initializePaystackPayment(data);
                case "flutterwave":
                    return this.initializeFlutterwavePayment(data);
                case "paypal":
                    return this.initializePayPalPayment(data);
                case "stripe":
                    return this.initializeStripePayment(data);
                default:
                    return {
                        success: false,
                        reference: data.reference,
                        error: "Unsupported payment processor",
                    };
            }
        });
    }
    // Verify payment based on processor
    static verifyPayment(processor, reference) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (processor) {
                case "paystack":
                    return this.verifyPaystackPayment(reference);
                case "flutterwave":
                    return this.verifyFlutterwavePayment(reference);
                case "paypal":
                    return this.verifyPayPalPayment(reference);
                case "stripe":
                    return this.verifyStripePayment(reference);
                default:
                    return {
                        success: false,
                        reference,
                        error: "Unsupported payment processor",
                    };
            }
        });
    }
}
exports.PaymentService = PaymentService;
