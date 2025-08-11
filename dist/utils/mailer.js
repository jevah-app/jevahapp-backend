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
exports.sendResetPasswordEmail = exports.sendVerificationEmail = exports.sendWelcomeEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});
const sendEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ to, subject, templateName, context }) {
    const templatePath = path_1.default.join(__dirname, "../emails/templates", `${templateName}.ejs`);
    try {
        const html = yield ejs_1.default.renderFile(templatePath, context);
        const mailOptions = {
            from: `"Tevah App" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html,
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log("✅ Email sent:", info.messageId);
        return info;
    }
    catch (error) {
        console.error("❌ Email send failed:", error);
        throw new Error("Failed to send email");
    }
});
const sendWelcomeEmail = (email, firstName) => __awaiter(void 0, void 0, void 0, function* () {
    return sendEmail({
        to: email,
        subject: "Welcome to Tevah 🎉",
        templateName: "welcome",
        context: { firstName },
    });
});
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendVerificationEmail = (email, firstName, code) => __awaiter(void 0, void 0, void 0, function* () {
    return sendEmail({
        to: email,
        subject: "Verify Your Email Address",
        templateName: "verify",
        context: { firstName, code },
    });
});
exports.sendVerificationEmail = sendVerificationEmail;
const sendResetPasswordEmail = (email, firstName, resetLink) => __awaiter(void 0, void 0, void 0, function* () {
    return sendEmail({
        to: email,
        subject: "Reset Your Password",
        templateName: "reset",
        context: { firstName, resetLink },
    });
});
exports.sendResetPasswordEmail = sendResetPasswordEmail;
