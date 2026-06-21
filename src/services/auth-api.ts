import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';

export interface AuthSession {
  token:     string;
  userId:    string;
  userType:  string;
  sessionId: string;
  expiresAt: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.title ?? 'Request failed');
  return json.data as T;
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
}

export async function requestOtp(phone: string): Promise<void> {
  await post('/v1/auth/otp/request', { phone });
}

export async function verifyOtp(phone: string, code: string): Promise<AuthSession> {
  return post<AuthSession>('/v1/auth/otp/verify', { phone, code });
}

export async function verifyToken(token: string): Promise<{ valid: boolean }> {
  return post<{ valid: boolean }>('/v1/auth/token/verify', { token });
}

export async function revokeSession(sessionId: string, token: string): Promise<void> {
  await fetch(`${BASE_URL}/v1/auth/sessions/${sessionId}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
