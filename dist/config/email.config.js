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
exports.EmailService = exports.emailTemplates = exports.emailTransporter = exports.emailConfig = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Email configuration
exports.emailConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER || "support@jevahapp.com",
        pass: process.env.SMTP_PASS || "",
    },
};
// Create email transporter
exports.emailTransporter = nodemailer_1.default.createTransport(exports.emailConfig);
// Email templates with new color scheme
exports.emailTemplates = {
    // Media interaction notifications
    mediaLiked: (mediaTitle, artistName) => ({
        subject: `Your content "${mediaTitle}" was liked!`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #112e2a; color: #ffffff; padding: 30px; border-radius: 8px;">
        <h2 style="color: #f9c833; margin-top: 0;">🎵 Your content was liked!</h2>
        <p>Hello ${artistName},</p>
        <p>Great news! Your content "<strong>${mediaTitle}</strong>" received a new like.</p>
        <p>Keep creating amazing content for your audience!</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL || "https://jevahapp.com"}" style="display: inline-block; background-color: #f9c833; color: #112e2a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">View Content</a>
        </div>
        <p style="font-size: 12px; color: #a0a0a0; text-align: center;">Best regards,<br>The Jevah Team</p>
      </div>
    `,
        text: `Your content "${mediaTitle}" was liked! Keep creating amazing content for your audience!`,
    }),
    mediaShared: (mediaTitle, artistName) => ({
        subject: `Your content "${mediaTitle}" was shared!`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #112e2a; color: #ffffff; padding: 30px; border-radius: 8px;">
        <h2 style="color: #f9c833; margin-top: 0;">📤 Your content was shared!</h2>
        <p>Hello ${artistName},</p>
        <p>Exciting news! Your content "<strong>${mediaTitle}</strong>" was shared by someone.</p>
        <p>Your reach is growing! 🚀</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL || "https://jevahapp.com"}" style="display: inline-block; background-color: #f9c833; color: #112e2a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">View Content</a>
        </div>
        <p style="font-size: 12px; color: #a0a0a0; text-align: center;">Best regards,<br>The Jevah Team</p>
      </div>
    `,
        text: `Your content "${mediaTitle}" was shared! Your reach is growing!`,
    }),
    newFollower: (artistName, followerName) => ({
        subject: `New follower: ${followerName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #112e2a; color: #ffffff; padding: 30px; border-radius: 8px;">
        <h2 style="color: #f9c833; margin-top: 0;">👥 New follower!</h2>
        <p>Hello ${artistName},</p>
        <p><strong>${followerName}</strong> started following you!</p>
        <p>Your audience is growing! 🎉</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL || "https://jevahapp.com"}/profile" style="display: inline-block; background-color: #f9c833; color: #112e2a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">View Profile</a>
        </div>
        <p style="font-size: 12px; color: #a0a0a0; text-align: center;">Best regards,<br>The Jevah Team</p>
      </div>
    `,
        text: `New follower: ${followerName} started following you!`,
    }),
    merchandisePurchase: (artistName, customerName, productName, amount) => ({
        subject: `New merchandise purchase: ${productName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #112e2a; color: #ffffff; padding: 30px; border-radius: 8px;">
        <h2 style="color: #f9c833; margin-top: 0;">🛍️ New merchandise purchase!</h2>
        <p>Hello ${artistName},</p>
        <p><strong>${customerName}</strong> purchased your merchandise:</p>
        <ul style="list-style: none; padding-left: 0;">
          <li style="margin-bottom: 8px;"><strong>Product:</strong> ${productName}</li>
          <li style="margin-bottom: 8px;"><strong>Amount:</strong> $${amount.toFixed(2)}</li>
        </ul>
        <p>Great job! Your merchandise is selling! 💰</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL || "https://jevahapp.com"}/merch" style="display: inline-block; background-color: #f9c833; color: #112e2a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">View Merchandise</a>
        </div>
        <p style="font-size: 12px; color: #a0a0a0; text-align: center;">Best regards,<br>The Jevah Team</p>
      </div>
    `,
        text: `New merchandise purchase: ${customerName} bought ${productName} for $${amount.toFixed(2)}`,
    }),
    songDownloaded: (artistName, songTitle, downloaderName) => ({
        subject: `Song downloaded: ${songTitle}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #112e2a; color: #ffffff; padding: 30px; border-radius: 8px;">
        <h2 style="color: #f9c833; margin-top: 0;">⬇️ Song downloaded!</h2>
        <p>Hello ${artistName},</p>
        <p><strong>${downloaderName}</strong> downloaded your song "<strong>${songTitle}</strong>" for offline listening.</p>
        <p>Your music is reaching more people! 🎵</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL || "https://jevahapp.com"}/music" style="display: inline-block; background-color: #f9c833; color: #112e2a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">View Music</a>
        </div>
        <p style="font-size: 12px; color: #a0a0a0; text-align: center;">Best regards,<br>The Jevah Team</p>
      </div>
    `,
        text: `${downloaderName} downloaded your song "${songTitle}" for offline listening`,
    }),
    // Game notifications for kids
    gameCompleted: (childName, gameName, score) => ({
        subject: `Game completed: ${gameName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #112e2a; color: #ffffff; padding: 30px; border-radius: 8px;">
        <h2 style="color: #f9c833; margin-top: 0;">🎮 Game completed!</h2>
        <p>Hello ${childName},</p>
        <p>Congratulations! You completed <strong>${gameName}</strong> with a score of <strong>${score}</strong>!</p>
        <p>Great job! Keep playing and learning! 🌟</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL || "https://jevahapp.com"}/games" style="display: inline-block; background-color: #f9c833; color: #112e2a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Play More Games</a>
        </div>
        <p style="font-size: 12px; color: #a0a0a0; text-align: center;">Best regards,<br>The Jevah Team</p>
      </div>
    `,
        text: `Congratulations! You completed ${gameName} with a score of ${score}!`,
    }),
    // General notifications
    welcomeArtist: (artistName) => ({
        subject: `Welcome to Jevah, ${artistName}!`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #112e2a; color: #ffffff; padding: 30px; border-radius: 8px;">
        <h2 style="color: #f9c833; margin-top: 0;">🎵 Welcome to Jevah!</h2>
        <p>Hello ${artistName},</p>
        <p>Welcome to the Jevah family! We're excited to have you as part of our gospel music community.</p>
        <p>You can now:</p>
        <ul style="list-style: none; padding-left: 0;">
          <li style="margin-bottom: 8px;">✅ Upload your music</li>
          <li style="margin-bottom: 8px;">✅ Connect with your audience</li>
          <li style="margin-bottom: 8px;">✅ Sell your merchandise</li>
          <li style="margin-bottom: 8px;">✅ Track your analytics</li>
        </ul>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL || "https://jevahapp.com"}/dashboard" style="display: inline-block; background-color: #f9c833; color: #112e2a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Get Started</a>
        </div>
        <p style="font-size: 12px; color: #a0a0a0; text-align: center;">Best regards,<br>The Jevah Team</p>
      </div>
    `,
        text: `Welcome to Jevah! Start sharing your gift with the world!`,
    }),
};
// Email service class
class EmailService {
    static sendEmail(to, template) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mailOptions = {
                    from: `"Jevah Support" <${exports.emailConfig.auth.user}>`,
                    to,
                    subject: template.subject,
                    html: template.html,
                    text: template.text,
                };
                yield exports.emailTransporter.sendMail(mailOptions);
                console.log(`Email sent successfully to ${to}`);
            }
            catch (error) {
                console.error("Email sending failed:", error);
                throw new Error("Failed to send email");
            }
        });
    }
    static sendMediaLikedEmail(artistEmail, mediaTitle, artistName) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = exports.emailTemplates.mediaLiked(mediaTitle, artistName);
            yield this.sendEmail(artistEmail, template);
        });
    }
    static sendMediaSharedEmail(artistEmail, mediaTitle, artistName) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = exports.emailTemplates.mediaShared(mediaTitle, artistName);
            yield this.sendEmail(artistEmail, template);
        });
    }
    static sendNewFollowerEmail(artistEmail, artistName, followerName) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = exports.emailTemplates.newFollower(artistName, followerName);
            yield this.sendEmail(artistEmail, template);
        });
    }
    static sendMerchandisePurchaseEmail(artistEmail, artistName, customerName, productName, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = exports.emailTemplates.merchandisePurchase(artistName, customerName, productName, amount);
            yield this.sendEmail(artistEmail, template);
        });
    }
    static sendSongDownloadedEmail(artistEmail, artistName, songTitle, downloaderName) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = exports.emailTemplates.songDownloaded(artistName, songTitle, downloaderName);
            yield this.sendEmail(artistEmail, template);
        });
    }
    static sendGameCompletedEmail(childEmail, childName, gameName, score) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = exports.emailTemplates.gameCompleted(childName, gameName, score);
            yield this.sendEmail(childEmail, template);
        });
    }
    static sendWelcomeArtistEmail(artistEmail, artistName) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = exports.emailTemplates.welcomeArtist(artistName);
            yield this.sendEmail(artistEmail, template);
        });
    }
}
exports.EmailService = EmailService;
