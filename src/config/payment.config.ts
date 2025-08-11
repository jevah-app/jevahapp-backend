import axios from "axios";

// Payment processor types
export type PaymentProcessor = "paystack" | "flutterwave" | "paypal" | "stripe";

// Payment status types
export type PaymentStatus =
  | "pending"
  | "successful"
  | "failed"
  | "cancelled"
  | "refunded";

// Subscription types
export type SubscriptionType = "monthly" | "yearly" | "lifetime";

// Payment interface
export interface PaymentRequest {
  amount: number;
  currency: string;
  email: string;
  reference: string;
  callback_url: string;
  metadata?: Record<string, any>;
}

// Payment response interface
export interface PaymentResponse {
  success: boolean;
  reference: string;
  authorization_url?: string;
  access_code?: string;
  payment_url?: string;
  checkout_url?: string;
  error?: string;
}

// Subscription interface
export interface SubscriptionRequest {
  userId: string;
  subscriptionType: SubscriptionType;
  amount: number;
  currency: string;
  email: string;
  paymentProcessor: PaymentProcessor;
}

// Merch purchase interface
export interface MerchPurchaseRequest {
  userId: string;
  artistId: string;
  merchItemId: string;
  quantity: number;
  amount: number;
  currency: string;
  email: string;
  paymentProcessor: PaymentProcessor;
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

// Payment configuration
export const paymentConfig = {
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
    baseUrl:
      process.env.NODE_ENV === "production"
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
export class PaymentService {
  // Initialize payment with Paystack
  static async initializePaystackPayment(
    data: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const response = await axios.post(
        `${paymentConfig.paystack.baseUrl}/transaction/initialize`,
        {
          amount: data.amount * 100, // Convert to kobo
          email: data.email,
          reference: data.reference,
          callback_url: data.callback_url,
          metadata: data.metadata,
        },
        {
          headers: {
            Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status) {
        return {
          success: true,
          reference: response.data.data.reference,
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
        };
      } else {
        return {
          success: false,
          reference: data.reference,
          error: response.data.message || "Payment initialization failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        reference: data.reference,
        error: error.response?.data?.message || "Payment initialization failed",
      };
    }
  }

  // Initialize payment with Flutterwave
  static async initializeFlutterwavePayment(
    data: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const response = await axios.post(
        `${paymentConfig.flutterwave.baseUrl}/payments`,
        {
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
        },
        {
          headers: {
            Authorization: `Bearer ${paymentConfig.flutterwave.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        return {
          success: true,
          reference: data.reference,
          payment_url: response.data.data.link,
        };
      } else {
        return {
          success: false,
          reference: data.reference,
          error: response.data.message || "Payment initialization failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        reference: data.reference,
        error: error.response?.data?.message || "Payment initialization failed",
      };
    }
  }

  // Initialize payment with PayPal
  static async initializePayPalPayment(
    data: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      // First, get access token
      const tokenResponse = await axios.post(
        `${paymentConfig.paypal.baseUrl}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${paymentConfig.paypal.clientId}:${paymentConfig.paypal.clientSecret}`
            ).toString("base64")}`,
          },
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Create PayPal order
      const orderResponse = await axios.post(
        `${paymentConfig.paypal.baseUrl}/v2/checkout/orders`,
        {
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
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (orderResponse.data.id) {
        return {
          success: true,
          reference: data.reference,
          checkout_url: orderResponse.data.links.find(
            (link: any) => link.rel === "approve"
          )?.href,
        };
      } else {
        return {
          success: false,
          reference: data.reference,
          error: "PayPal order creation failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        reference: data.reference,
        error:
          error.response?.data?.message ||
          "PayPal payment initialization failed",
      };
    }
  }

  // Initialize payment with Stripe
  static async initializeStripePayment(
    data: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const stripe = require("stripe")(paymentConfig.stripe.secretKey);

      const session = await stripe.checkout.sessions.create({
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
        metadata: {
          reference: data.reference,
          ...data.metadata,
        },
      });

      return {
        success: true,
        reference: data.reference,
        checkout_url: session.url,
      };
    } catch (error: any) {
      return {
        success: false,
        reference: data.reference,
        error: error.message || "Stripe payment initialization failed",
      };
    }
  }

  // Verify payment with Paystack
  static async verifyPaystackPayment(
    reference: string
  ): Promise<PaymentResponse> {
    try {
      const response = await axios.get(
        `${paymentConfig.paystack.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
          },
        }
      );

      if (response.data.status && response.data.data.status === "success") {
        return {
          success: true,
          reference,
        };
      } else {
        return {
          success: false,
          reference,
          error: "Payment verification failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        reference,
        error: error.response?.data?.message || "Payment verification failed",
      };
    }
  }

  // Verify payment with Flutterwave
  static async verifyFlutterwavePayment(
    reference: string
  ): Promise<PaymentResponse> {
    try {
      const response = await axios.get(
        `${paymentConfig.flutterwave.baseUrl}/transactions/${reference}/verify`,
        {
          headers: {
            Authorization: `Bearer ${paymentConfig.flutterwave.secretKey}`,
          },
        }
      );

      if (
        response.data.status === "success" &&
        response.data.data.status === "successful"
      ) {
        return {
          success: true,
          reference,
        };
      } else {
        return {
          success: false,
          reference,
          error: "Payment verification failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        reference,
        error: error.response?.data?.message || "Payment verification failed",
      };
    }
  }

  // Verify payment with PayPal
  static async verifyPayPalPayment(orderId: string): Promise<PaymentResponse> {
    try {
      // Get access token
      const tokenResponse = await axios.post(
        `${paymentConfig.paypal.baseUrl}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${paymentConfig.paypal.clientId}:${paymentConfig.paypal.clientSecret}`
            ).toString("base64")}`,
          },
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Capture payment
      const captureResponse = await axios.post(
        `${paymentConfig.paypal.baseUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (captureResponse.data.status === "COMPLETED") {
        return {
          success: true,
          reference: orderId,
        };
      } else {
        return {
          success: false,
          reference: orderId,
          error: "Payment verification failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        reference: orderId,
        error: error.response?.data?.message || "Payment verification failed",
      };
    }
  }

  // Verify payment with Stripe
  static async verifyStripePayment(
    sessionId: string
  ): Promise<PaymentResponse> {
    try {
      const stripe = require("stripe")(paymentConfig.stripe.secretKey);

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === "paid") {
        return {
          success: true,
          reference: session.metadata.reference,
        };
      } else {
        return {
          success: false,
          reference: session.metadata.reference,
          error: "Payment verification failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        reference: sessionId,
        error: error.message || "Payment verification failed",
      };
    }
  }

  // Initialize payment based on processor
  static async initializePayment(
    processor: PaymentProcessor,
    data: PaymentRequest
  ): Promise<PaymentResponse> {
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
  }

  // Verify payment based on processor
  static async verifyPayment(
    processor: PaymentProcessor,
    reference: string
  ): Promise<PaymentResponse> {
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
  }
}
