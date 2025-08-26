import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER!,
    pass: process.env.GMAIL_PASS!,
  },
});

interface MailData {
  to: string;
  subject: string;
  templateName: string;
  context: Record<string, any>;
}

const sendEmail = async ({ to, subject, templateName, context }: MailData) => {
  const templatePath = path.join(
    __dirname,
    "../emails/templates",
    `${templateName}.ejs`
  );

  try {
    const html = await ejs.renderFile(templatePath, context);

    const mailOptions = {
      from: `"Tevah App" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email send failed:", error);
    throw new Error("Failed to send email");
  }
};

export const sendWelcomeEmail = async (email: string, firstName: string) => {
  return sendEmail({
    to: email,
    subject: "Welcome to Tevah 🎉",
    templateName: "welcome",
    context: { firstName },
  });
};

export const sendVerificationEmail = async (
  email: string,
  firstName: string,
  code: string
) => {
  return sendEmail({
    to: email,
    subject: "Verify Your Email Address",
    templateName: "verify",
    context: { firstName, code },
  });
};

export const sendResetPasswordEmail = async (
  email: string,
  firstName: string,
  code?: string
) => {
  return sendEmail({
    to: email,
    subject: "Reset Your Password",
    templateName: "reset",
    context: code ? { firstName, code } : { firstName },
  });
};
