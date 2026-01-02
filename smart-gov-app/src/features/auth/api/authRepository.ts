import { getApiClient } from '../../../core/api/axiosClient';
import type { User } from '../../../core/domain/user';

export type RequestOtpResponse = {
  otpRequestId: string;
  expiresAt: string;
  // Returned by backend only in non-production environments
  otp?: string;
};
export type VerifyOtpResponse = { token: string; user: User };

export async function requestLoginOtp(nationalId: string, phoneNumber: string): Promise<RequestOtpResponse> {
  const res = await getApiClient().post<RequestOtpResponse>('/auth/login/request-otp', {
    nationalId,
    phoneNumber,
  });
  return res.data;
}

export async function requestSignupOtp(
  nationalId: string,
  phoneNumber: string,
  fullName: string
): Promise<RequestOtpResponse> {
  const res = await getApiClient().post<RequestOtpResponse>('/auth/signup/request-otp', {
    nationalId,
    phoneNumber,
    fullName,
  });
  return res.data;
}

export async function verifyOtp(phoneNumber: string, otp: string): Promise<VerifyOtpResponse> {
  const res = await getApiClient().post<VerifyOtpResponse>('/auth/verify-otp', { phoneNumber, otp });
  return res.data;
}
