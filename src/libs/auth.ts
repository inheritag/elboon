import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { config } from './config';

export const SESSION_COOKIE_NAME = 'elboon_admin_session';
export const CUSTOMER_COOKIE_NAME = 'elboon_customer_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

// --- Password hashing (for the one admin credential, stored as ADMIN_PASSWORD_HASH) ---

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const candidate = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  if (candidate.length !== stored.length) return false;

  return timingSafeEqual(candidate, stored);
}

// --- Session tokens (a signed, expiring value stored in a cookie; no server-side session store needed) ---

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature) return false;
  if (!signaturesMatch(signature, sign(expiresAt))) return false;

  return Number(expiresAt) > Date.now();
}

export function createCustomerSessionToken(userId: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function readCustomerSessionUserId(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiresAt, signature] = parts;
  if (!userId || !expiresAt || !signature) return null;
  if (!signaturesMatch(signature, sign(`${userId}.${expiresAt}`))) return null;
  if (Number(expiresAt) <= Date.now()) return null;
  return userId;
}

export function cookieSettings(): {
  path: '/';
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  maxAge: number;
} {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: config.siteUrl().startsWith('https://'),
    maxAge: 60 * 60 * 12
  };
}

/** Only allow in-app paths so login cannot bounce to another site. */
export function safeInternalPath(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('://')) return fallback;
  return value;
}

function sign(value: string): string {
  return createHmac('sha256', config.sessionSecret()).update(value).digest('hex');
}

function signaturesMatch(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
