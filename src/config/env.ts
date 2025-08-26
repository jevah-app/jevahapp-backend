import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not defined in environment variables`);
  return v;
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 4000),
  JWT_SECRET: required('JWT_SECRET'),
  // Mailer
  SMTP_HOST: required('SMTP_HOST'),
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: required('SMTP_USER'),
  SMTP_PASS: required('SMTP_PASS'),
  MAIL_FROM: process.env.MAIL_FROM || 'no-reply@jevah.app',
};