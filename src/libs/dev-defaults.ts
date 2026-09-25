/** Fallback admin password when DEV_MODE=true and ADMIN_PASSWORD_HASH is unset. */
export const DEV_ADMIN_PASSWORD = 'elboon-dev';

/** Fallback signing key when DEV_MODE=true and SESSION_SECRET is unset. */
export const DEV_SESSION_SECRET = 'elboon-dev-session-secret-not-for-production';

/** scrypt hash of DEV_ADMIN_PASSWORD (salt:hash). */
export const DEV_ADMIN_PASSWORD_HASH =
  '4583583ab8e41b454239b77f75895428:34ca691485eb2508b31e9e8ff8dff39090a0f789fd2e4cfbb42daa8001550735696ce45e5b674f745764f20f493b0822199c3c809b62d97448d3e10234fd1648';

export const DEFAULT_DEV_STORE_PATH = '.data/dev-store.json';
