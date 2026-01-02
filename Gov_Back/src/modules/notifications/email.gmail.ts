import nodemailer from 'nodemailer';

type EmailProvider = {
  sendEmail(to: string, subject: string, htmlOrText: string): Promise<void>;
};

export function createGmailSmtpProvider(): EmailProvider {
  const host = process.env.SMTP_HOST ?? 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure = (process.env.SMTP_SECURE ?? 'true') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (!user) throw new Error('Missing SMTP_USER');
  if (!pass) throw new Error('Missing SMTP_PASS');
  if (!from) throw new Error('Missing EMAIL_FROM');

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  return {
    async sendEmail(to, subject, htmlOrText) {
      const isHtml = /<\/?[a-z][\s\S]*>/i.test(htmlOrText);

      await transporter.sendMail({
        from,
        to,
        subject,
        text: isHtml ? undefined : htmlOrText,
        html: isHtml ? htmlOrText : undefined
      });
    }
  };
}
