// import nodemailer from "nodemailer";
// import ejs from "ejs";
// import path from "path";
// import dotenv from "dotenv";

// dotenv.config();

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.GMAIL_USER!,
//     pass: process.env.GMAIL_PASS!,
//   },
// });

// interface MailData {
//   to: string;
//   subject: string;
//   templateName: string;
//   context: Record<string, any>;
// }

// const sendEmail = async ({ to, subject, templateName, context }: MailData) => {
//   const templatePath = path.join(
//     __dirname,
//     "../emails/templates",
//     `${templateName}.ejs`
//   );

//   try {
//     const html = await ejs.renderFile(templatePath, context);

//     const mailOptions = {
//       from: `"Tevah App" <${process.env.GMAIL_USER}>`,
//       to,
//       subject,
//       html,
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log("✅ Email sent:", info.messageId);
//     return info;
//   } catch (error) {
//     console.error("❌ Email send failed:", error);
//     throw new Error("Failed to send email");
//   }
// };

// export const sendWelcomeEmail = async (email: string, firstName: string) => {
//   return sendEmail({
//     to: email,
//     subject: "Welcome to Tevah 🎉",
//     templateName: "welcome",
//     context: { firstName },
//   });
// };

// export const sendVerificationEmail = async (
//   email: string,
//   firstName: string,
//   code: string
// ) => {
//   return sendEmail({
//     to: email,
//     subject: "Verify Your Email Address",
//     templateName: "verify",
//     context: { firstName, code },
//   });
// };

// export const sendResetPasswordEmail = async (
//   email: string,
//   firstName: string,
//   code?: string
// ) => {
//   return sendEmail({
//     to: email,
//     subject: "Reset Your Password",
//     templateName: "reset",
//     context: code ? { firstName, code } : { firstName },
//   });
// };











import path from 'path';
import ejs from 'ejs';
import nodemailer from 'nodemailer';

const templatesDir = path.join(__dirname, '../emails/templates');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendResetOtpEmail(user: { email: string; firstName?: string }, code: string) {
  const html = await ejs.renderFile(
    path.join(templatesDir, 'reset.ejs'),
    { code, firstName: user.firstName || '' },
    { async: true }
  );

  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'no-reply@jevah.app',
    to: user.email,
    subject: 'Your password reset code',
    html,
  });
}