import { env } from '$env/dynamic/private';
import {
  DEFAULT_DEV_STORE_PATH,
  DEV_ADMIN_PASSWORD_HASH,
  DEV_SESSION_SECRET
} from './dev-defaults';

/**
 * Every environment variable the app needs, read from one place. Each
 * getter throws a clear error the first time it's used with a missing
 * value, instead of the app failing later with a cryptic `undefined`.
 *
 * SvelteKit loads `.env` into `$env/dynamic/private`, not `process.env`,
 * so we read from there first and fall back to the process environment
 * for scripts and tests.
 *
 * DEV_MODE=true skips Postgres: the app uses a local JSON/memory store.
 * Offer email is optional. New haggles always show in /admin/offers.
 */

function envValue(name: string): string | undefined {
  return env[name] || process.env[name] || undefined;
}

function requireEnv(name: string): string {
  const value = envValue(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isTruthy(value: string | undefined): boolean {
  if (!value) return false;
  return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
}

export const config = {
  isDevMode: () => isTruthy(envValue('DEV_MODE')),

  /** `disk` persists to JSON; `memory` is wiped when the process exits. */
  devStore: (): 'disk' | 'memory' => (envValue('DEV_STORE') === 'memory' ? 'memory' : 'disk'),

  devStorePath: () => envValue('DEV_STORE_PATH') ?? DEFAULT_DEV_STORE_PATH,

  databaseUrl: () => envValue('POSTGRES_URL') || envValue('DATABASE_URL') || requireEnv('POSTGRES_URL'),

  /** Optional. Offers still appear in admin if this is unset. */
  resendApiKey: () => envValue('RESEND_API_KEY'),

  adminPasswordHash: () => {
    const value = envValue('ADMIN_PASSWORD_HASH');
    if (value) return value;
    if (config.isDevMode()) return DEV_ADMIN_PASSWORD_HASH;
    return requireEnv('ADMIN_PASSWORD_HASH');
  },

  sessionSecret: () => {
    const value = envValue('SESSION_SECRET');
    if (value) return value;
    if (config.isDevMode()) return DEV_SESSION_SECRET;
    return requireEnv('SESSION_SECRET');
  },

  siteUrl: () => envValue('SITE_URL') ?? envValue('PUBLIC_SITE_URL') ?? 'http://localhost:5173',

  /** Where new haggles are sent so the shop can accept, ignore, or counter. */
  offersInbox: () => envValue('OFFERS_INBOX') ?? 'elboonltd@gmail.com'
};
