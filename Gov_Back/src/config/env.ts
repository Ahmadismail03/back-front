import dotenv from 'dotenv';

dotenv.config();

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),

  DATABASE_URL: req('DATABASE_URL'),

  JWT_SECRET: req('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',

  OTP_TTL_MINUTES: Number(process.env.OTP_TTL_MINUTES ?? 5),
  OTP_MAX_ATTEMPTS_PER_HOUR: Number(process.env.OTP_MAX_ATTEMPTS_PER_HOUR ?? 10),

  RASA_BASE_URL: process.env.RASA_BASE_URL ?? 'http://localhost:5005',

  AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT!,
  AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY!,
  AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION!,
  AZURE_OPENAI_EMBEDDING_DEPLOYMENT: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT!,

  // =========================
  // EMAIL (SMTP)
  // =========================
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER ?? 'console',
  EMAIL_FROM: process.env.EMAIL_FROM ?? 'Gov App <no-reply@example.com>',

  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 465),
  SMTP_SECURE: (process.env.SMTP_SECURE ?? 'true') === 'true',
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
};
