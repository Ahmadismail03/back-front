import crypto from 'crypto';
import { prisma } from '../../db/prisma.js';

export interface SmsProvider {
  sendSms(to: string, message: string): Promise<void>;
}

export class ConsoleSmsProvider implements SmsProvider {
  async sendSms(to: string, message: string): Promise<void> {
    console.log(`[SMS to ${to}] ${message}`);
  }
}

export async function logNotification(data: {
  userId: string;
  type: 'SMS' | 'EMAIL';
  content: string;
  sentAt?: Date;
}) {
  return prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      userId: data.userId,
      type: data.type,
      content: data.content,
      sentAt: data.sentAt ?? new Date()
    }
  });
}
