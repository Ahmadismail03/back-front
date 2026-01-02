import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

export type EmailProvider = {
  sendEmail(to: string, subject: string, htmlOrText: string): Promise<void>;
};

export function createSmtpEmailProvider(): EmailProvider {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error('SMTP env vars missing (SMTP_HOST/SMTP_USER/SMTP_PASS)');
  }
  if (!env.EMAIL_FROM) {
    throw new Error('Missing EMAIL_FROM');
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
  });

  return {
    async sendEmail(to, subject, htmlOrText) {
      const isHtml = /<\/?[a-z][\s\S]*>/i.test(htmlOrText);

      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        text: isHtml ? undefined : htmlOrText,
        html: isHtml ? htmlOrText : undefined
      });
    }
  };
}
