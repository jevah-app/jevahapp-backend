import nodemailer from "nodemailer";

export interface EmailConfiguration {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email configuration
export const emailConfig: EmailConfiguration = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "support@jevahapp.com",
    pass: process.env.SMTP_PASS || "",
  },
};

// Create email transporter
export const emailTransporter = nodemailer.createTransport(emailConfig);

// Email templates with new color scheme
export const emailTemplates = {
  // Media interaction notifications
  mediaLiked: (mediaTitle: string, artistName: string): EmailTemplate => ({
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

  mediaShared: (mediaTitle: string, artistName: string): EmailTemplate => ({
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

  newFollower: (artistName: string, followerName: string): EmailTemplate => ({
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

  merchandisePurchase: (
    artistName: string,
    customerName: string,
    productName: string,
    amount: number
  ): EmailTemplate => ({
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

  songDownloaded: (
    artistName: string,
    songTitle: string,
    downloaderName: string
  ): EmailTemplate => ({
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
  gameCompleted: (
    childName: string,
    gameName: string,
    score: number
  ): EmailTemplate => ({
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
  welcomeArtist: (artistName: string): EmailTemplate => ({
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
export class EmailService {
  public static async sendEmail(
    to: string,
    template: EmailTemplate
  ): Promise<void> {
    try {
      const mailOptions = {
        from: `"Jevah Support" <${emailConfig.auth.user}>`,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      await emailTransporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error("Email sending failed:", error);
      throw new Error("Failed to send email");
    }
  }

  public static async sendMediaLikedEmail(
    artistEmail: string,
    mediaTitle: string,
    artistName: string
  ): Promise<void> {
    const template = emailTemplates.mediaLiked(mediaTitle, artistName);
    await this.sendEmail(artistEmail, template);
  }

  public static async sendMediaSharedEmail(
    artistEmail: string,
    mediaTitle: string,
    artistName: string
  ): Promise<void> {
    const template = emailTemplates.mediaShared(mediaTitle, artistName);
    await this.sendEmail(artistEmail, template);
  }

  public static async sendNewFollowerEmail(
    artistEmail: string,
    artistName: string,
    followerName: string
  ): Promise<void> {
    const template = emailTemplates.newFollower(artistName, followerName);
    await this.sendEmail(artistEmail, template);
  }

  public static async sendMerchandisePurchaseEmail(
    artistEmail: string,
    artistName: string,
    customerName: string,
    productName: string,
    amount: number
  ): Promise<void> {
    const template = emailTemplates.merchandisePurchase(
      artistName,
      customerName,
      productName,
      amount
    );
    await this.sendEmail(artistEmail, template);
  }

  public static async sendSongDownloadedEmail(
    artistEmail: string,
    artistName: string,
    songTitle: string,
    downloaderName: string
  ): Promise<void> {
    const template = emailTemplates.songDownloaded(
      artistName,
      songTitle,
      downloaderName
    );
    await this.sendEmail(artistEmail, template);
  }

  public static async sendGameCompletedEmail(
    childEmail: string,
    childName: string,
    gameName: string,
    score: number
  ): Promise<void> {
    const template = emailTemplates.gameCompleted(childName, gameName, score);
    await this.sendEmail(childEmail, template);
  }

  public static async sendWelcomeArtistEmail(
    artistEmail: string,
    artistName: string
  ): Promise<void> {
    const template = emailTemplates.welcomeArtist(artistName);
    await this.sendEmail(artistEmail, template);
  }
}
