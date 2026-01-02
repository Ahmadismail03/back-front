import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { prisma } from '../../db/prisma.js';
import { validateBody } from '../../middlewares/validate.js';
import { HttpError } from '../../middlewares/errorHandler.js';
import { env } from '../../config/env.js';

export const authRouter = Router();

// ✅ اعتبر UNKNOWN كأنه “فاضي”
const isMissing = (v?: string | null) => !v || v === 'UNKNOWN';

// ✅ يسمح عربي/إنجليزي فقط داخل كل كلمة (بدون أرقام/رموز)
const NameTokenRegex = /^[\p{Script=Arabic}A-Za-z]+$/u;

function parseQuadName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length !== 4) {
    throw new HttpError(400, 'Full name must be exactly 4 words');
  }

  for (const p of parts) {
    if (!NameTokenRegex.test(p)) {
      throw new HttpError(400, 'Name must contain only Arabic/English letters (no numbers/symbols)');
    }
  }

  const [firstName, secondName, thirdName, familyName] = parts;
  return { firstName, secondName, thirdName, familyName };
}

function generateOtp(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}

function signUserToken(payload: { userId: string }) {
  return jwt.sign({ ...payload, role: 'user' }, env.JWT_SECRET, { expiresIn: '7d' });
}

// =========================
// Schemas
// =========================
const SignupRequestOtpSchema = z.object({
  nationalId: z.string().min(5),
  phoneNumber: z.string().min(7),
  fullName: z.string().trim().min(3) // ✅ required
});

const LoginRequestOtpSchema = z.object({
  nationalId: z.string().min(5),
  phoneNumber: z.string().min(7)
});

const VerifyOtpSchema = z.object({
  phoneNumber: z.string().min(7),
  otp: z.string().length(6)
});

// =========================
// POST /auth/signup/request-otp
// أول مرة فقط: لازم fullName + إذا موجود يرجع 409
// =========================
authRouter.post('/signup/request-otp', validateBody(SignupRequestOtpSchema), async (req, res, next) => {
  try {
    const { nationalId, phoneNumber, fullName } = req.body;
    const { firstName, secondName, thirdName, familyName } = parseQuadName(fullName);

    // ✅ تحقق: إذا اليوزر موجود مسبقاً (بنفس الرقم أو الهوية) => ممنوع signup
    const existing = await prisma.user.findFirst({
      where: { OR: [{ phoneNumber }, { nationalId }] }
    });

    if (existing) {
      return next(new HttpError(409, 'User already exists. Please login.'));
    }

    // ✅ create user
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        phoneNumber,
        nationalId,
        firstName,
        secondName,
        thirdName,
        familyName,
        preferredLanguage: 'ar'
      }
    });

    // create otp request
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpRequest.deleteMany({
      where: { userId: user.id, isVerified: false }
    });

    const otpReq = await prisma.otpRequest.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        otpCode: otp,
        expiresAt,
        isVerified: false
      },
      select: { id: true, expiresAt: true }
    });

    const isDev = env.NODE_ENV !== 'production';
    if (isDev) {
      console.log(`[DEV OTP SIGNUP] phone=${phoneNumber} otp=${otp} otpRequestId=${otpReq.id}`);
    }

    return res.json({
      otpRequestId: otpReq.id,
      expiresAt: otpReq.expiresAt,
      ...(isDev ? { otp } : {})
    });
  } catch (err) {
    next(err);
  }
});

// =========================
// POST /auth/login/request-otp
// Login فقط: بدون fullName + إذا مش موجود يرجع 404
// =========================
authRouter.post('/login/request-otp', validateBody(LoginRequestOtpSchema), async (req, res, next) => {
  try {
    const { nationalId, phoneNumber } = req.body;

    // ✅ أدق: لازم تطابق الهوية + الرقم معاً
    const user = await prisma.user.findFirst({
      where: { nationalId, phoneNumber }
    });

    if (!user) {
      return next(new HttpError(404, 'User not found. Please signup first.'));
    }

    // ✅ (اختياري لكن ممتاز): إذا الاسم ناقص/UNKNOWN -> ممنوع login قبل ما يكمله
    // بما إنك قلت "يرفض اذا كان الاسم ناقص"
    const nameIncomplete =
      isMissing(user.firstName) ||
      isMissing(user.secondName) ||
      isMissing(user.thirdName) ||
      isMissing(user.familyName);

    if (nameIncomplete) {
      return next(new HttpError(400, 'Profile name is incomplete. Please contact support or re-signup.'));
    }

    // create otp request
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpRequest.deleteMany({
      where: { userId: user.id, isVerified: false }
    });

    const otpReq = await prisma.otpRequest.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        otpCode: otp,
        expiresAt,
        isVerified: false
      },
      select: { id: true, expiresAt: true }
    });

    const isDev = env.NODE_ENV !== 'production';
    if (isDev) {
      console.log(`[DEV OTP LOGIN] phone=${phoneNumber} otp=${otp} otpRequestId=${otpReq.id}`);
    }

    return res.json({
      otpRequestId: otpReq.id,
      expiresAt: otpReq.expiresAt,
      ...(isDev ? { otp } : {})
    });
  } catch (err) {
    next(err);
  }
});

// =========================
// POST /auth/verify-otp
// (مشترك للـ signup + login)
// =========================
authRouter.post('/verify-otp', validateBody(VerifyOtpSchema), async (req, res, next) => {
  try {
    const { phoneNumber, otp } = req.body;
    const now = new Date();

    const user = await prisma.user.findFirst({ where: { phoneNumber } });
    if (!user) return next(new HttpError(404, 'User not found'));

    const otpReq = await prisma.otpRequest.findFirst({
      where: {
        userId: user.id,
        isVerified: false,
        expiresAt: { gt: now }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpReq) return next(new HttpError(400, 'OTP expired or not found'));
    if (otpReq.otpCode !== otp) return next(new HttpError(400, 'OTP invalid'));

    await prisma.otpRequest.update({
      where: { id: otpReq.id },
      data: { isVerified: true }
    });

    const token = signUserToken({ userId: user.id });

    return res.json({
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        nationalId: user.nationalId,
        firstName: user.firstName,
        secondName: user.secondName,
        thirdName: user.thirdName,
        familyName: user.familyName,
        fullName: `${user.firstName} ${user.secondName} ${user.thirdName} ${user.familyName}`
      }
    });
  } catch (err) {
    next(err);
  }
});
