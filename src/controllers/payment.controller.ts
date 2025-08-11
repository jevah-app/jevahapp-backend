import { Request, Response } from "express";
import { PaymentService } from "../config/payment.config";
import {
  PaymentTransaction,
  Subscription,
  MerchPurchase,
} from "../models/payment.model";
import { User } from "../models/user.model";
import { Types } from "mongoose";
import { AuditService } from "../service/audit.service";
import { EmailService } from "../config/email.config";

interface SubscriptionRequest {
  subscriptionType: "monthly" | "yearly" | "lifetime";
  paymentProcessor: "paystack" | "flutterwave" | "paypal" | "stripe";
  amount: number;
  currency: string;
}

interface MerchPurchaseRequest {
  artistId: string;
  merchItemId: string;
  quantity: number;
  paymentProcessor: "paystack" | "flutterwave" | "paypal" | "stripe";
  amount: number;
  currency: string;
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

// Initialize subscription payment
export const initializeSubscription = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { subscriptionType, paymentProcessor, amount, currency } =
      request.body as SubscriptionRequest;
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
    const user = await User.findById(userId);
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
    let endDate: Date;

    switch (subscriptionType) {
      case "monthly":
        endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case "yearly":
        endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
      case "lifetime":
        endDate = new Date(
          startDate.getTime() + 100 * 365 * 24 * 60 * 60 * 1000
        ); // 100 years
        break;
      default:
        response.status(400).json({
          success: false,
          message: "Invalid subscription type",
        });
        return;
    }

    // Create payment transaction record
    const paymentTransaction = await PaymentTransaction.create({
      userId: new Types.ObjectId(userId),
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
    const paymentResult = await PaymentService.initializePayment(
      paymentProcessor,
      {
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
      }
    );

    if (!paymentResult.success) {
      response.status(400).json({
        success: false,
        message: paymentResult.error || "Payment initialization failed",
      });
      return;
    }

    // Log payment activity
    await AuditService.logPaymentActivity(
      userId,
      "subscription_purchase",
      amount,
      currency,
      paymentProcessor,
      true,
      { subscriptionType, reference },
      request.ip,
      request.get("User-Agent")
    );

    response.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      data: {
        reference,
        paymentUrl:
          paymentResult.authorization_url ||
          paymentResult.payment_url ||
          paymentResult.checkout_url,
        accessCode: paymentResult.access_code,
      },
    });
  } catch (error: unknown) {
    console.error("Initialize subscription error:", error);

    response.status(500).json({
      success: false,
      message: "Failed to initialize subscription payment",
    });
  }
};

// Verify subscription payment
export const verifySubscriptionPayment = async (
  request: Request,
  response: Response
): Promise<void> => {
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
    const paymentTransaction = await PaymentTransaction.findOne({
      reference,
      userId: new Types.ObjectId(userId),
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
    const verificationResult = await PaymentService.verifyPayment(
      paymentProcessor,
      reference
    );

    if (verificationResult.success) {
      // Update payment transaction
      await PaymentTransaction.findByIdAndUpdate(paymentTransaction._id, {
        status: "successful",
        processorReference: reference,
        processorResponse: verificationResult,
      });

      // Create subscription
      const subscription = await Subscription.create({
        userId: new Types.ObjectId(userId),
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
      await User.findByIdAndUpdate(userId, {
        subscriptionTier: "premium",
        subscriptionStatus: "active",
        subscriptionEndDate: paymentTransaction.metadata.endDate,
      });

      // Send confirmation email
      const user = await User.findById(userId);
      if (user && user.email) {
        try {
          await EmailService.sendEmail(user.email, {
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
        } catch (emailError) {
          console.error(
            "Failed to send subscription confirmation email:",
            emailError
          );
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
    } else {
      // Update payment transaction as failed
      await PaymentTransaction.findByIdAndUpdate(paymentTransaction._id, {
        status: "failed",
        processorResponse: verificationResult,
      });

      response.status(400).json({
        success: false,
        message: verificationResult.error || "Payment verification failed",
      });
    }
  } catch (error: unknown) {
    console.error("Verify subscription payment error:", error);

    response.status(500).json({
      success: false,
      message: "Failed to verify subscription payment",
    });
  }
};

// Initialize merch purchase payment
export const initializeMerchPurchase = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const {
      artistId,
      merchItemId,
      quantity,
      paymentProcessor,
      amount,
      currency,
      shippingAddress,
    } = request.body as MerchPurchaseRequest;
    const userId = request.userId;

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    // Validate inputs
    if (
      !artistId ||
      !merchItemId ||
      !quantity ||
      !paymentProcessor ||
      !amount ||
      !currency
    ) {
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
    const user = await User.findById(userId);
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
    const paymentTransaction = await PaymentTransaction.create({
      userId: new Types.ObjectId(userId),
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
    const paymentResult = await PaymentService.initializePayment(
      paymentProcessor,
      {
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
      }
    );

    if (!paymentResult.success) {
      response.status(400).json({
        success: false,
        message: paymentResult.error || "Payment initialization failed",
      });
      return;
    }

    // Log payment activity
    await AuditService.logPaymentActivity(
      userId,
      "merch_purchase",
      amount,
      currency,
      paymentProcessor,
      true,
      { artistId, merchItemId, quantity, reference },
      request.ip,
      request.get("User-Agent")
    );

    response.status(200).json({
      success: true,
      message: "Merch purchase payment initialized successfully",
      data: {
        reference,
        paymentUrl:
          paymentResult.authorization_url ||
          paymentResult.payment_url ||
          paymentResult.checkout_url,
        accessCode: paymentResult.access_code,
      },
    });
  } catch (error: unknown) {
    console.error("Initialize merch purchase error:", error);

    response.status(500).json({
      success: false,
      message: "Failed to initialize merch purchase payment",
    });
  }
};

// Verify merch purchase payment
export const verifyMerchPurchase = async (
  request: Request,
  response: Response
): Promise<void> => {
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
    const paymentTransaction = await PaymentTransaction.findOne({
      reference,
      userId: new Types.ObjectId(userId),
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
    const verificationResult = await PaymentService.verifyPayment(
      paymentProcessor,
      reference
    );

    if (verificationResult.success) {
      // Update payment transaction
      await PaymentTransaction.findByIdAndUpdate(paymentTransaction._id, {
        status: "successful",
        processorReference: reference,
        processorResponse: verificationResult,
      });

      // Create merch purchase record
      const merchPurchase = await MerchPurchase.create({
        userId: new Types.ObjectId(userId),
        artistId: new Types.ObjectId(paymentTransaction.metadata.artistId),
        merchItemId: paymentTransaction.metadata.merchItemId,
        quantity: paymentTransaction.metadata.quantity,
        amount: paymentTransaction.amount,
        currency: paymentTransaction.currency,
        status: "paid",
        paymentTransaction: paymentTransaction._id,
        shippingAddress: paymentTransaction.metadata.shippingAddress,
      });

      // Update artist's merch stock
      await User.updateOne(
        {
          _id: paymentTransaction.metadata.artistId,
          "merchItems.id": paymentTransaction.metadata.merchItemId,
        },
        {
          $inc: {
            "merchItems.$.stockCount": -paymentTransaction.metadata.quantity,
          },
        }
      );

      // Send confirmation email to customer
      const user = await User.findById(userId);
      if (user && user.email) {
        try {
          await EmailService.sendEmail(user.email, {
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
        } catch (emailError) {
          console.error(
            "Failed to send merch purchase confirmation email:",
            emailError
          );
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
    } else {
      // Update payment transaction as failed
      await PaymentTransaction.findByIdAndUpdate(paymentTransaction._id, {
        status: "failed",
        processorResponse: verificationResult,
      });

      response.status(400).json({
        success: false,
        message: verificationResult.error || "Payment verification failed",
      });
    }
  } catch (error: unknown) {
    console.error("Verify merch purchase error:", error);

    response.status(500).json({
      success: false,
      message: "Failed to verify merch purchase payment",
    });
  }
};

// Get user's payment history
export const getUserPaymentHistory = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userId = request.userId;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 20;

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const skip = (page - 1) * limit;

    const payments = await PaymentTransaction.find({
      userId: new Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PaymentTransaction.countDocuments({
      userId: new Types.ObjectId(userId),
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
  } catch (error: unknown) {
    console.error("Get user payment history error:", error);

    response.status(500).json({
      success: false,
      message: "Failed to get payment history",
    });
  }
};

// Cancel subscription
export const cancelSubscription = async (
  request: Request,
  response: Response
): Promise<void> => {
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
    const subscription = await Subscription.findOne({
      userId: new Types.ObjectId(userId),
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
    await Subscription.findByIdAndUpdate(subscription._id, {
      status: "cancelled",
      autoRenew: false,
    });

    // Update user subscription
    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: "cancelled",
    });

    // Log activity
    await AuditService.logActivity({
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
  } catch (error: unknown) {
    console.error("Cancel subscription error:", error);

    response.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
    });
  }
};
