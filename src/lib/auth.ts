import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'dotvec_admin';

function secret(): string {
  return process.env.AUTH_SECRET || 'dev-secret-change-before-production';
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createAdminToken(email: string): string {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + 1000 * 60 * 60 * 12 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token?: string | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (signature.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp: number };
    return decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifyAdminToken(jar.get(COOKIE_NAME)?.value);
}

export async function setAdminCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export function credentialsValid(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const emailOk = email.toLowerCase() === expectedEmail.toLowerCase();
  const a = Buffer.from(password);
  const b = Buffer.from(expectedPassword);
  const passwordOk = a.length === b.length && crypto.timingSafeEqual(a, b);
  return emailOk && passwordOk;
}
