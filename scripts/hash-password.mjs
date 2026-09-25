// One-off CLI to generate an ADMIN_PASSWORD_HASH value for .env.
// Usage: node scripts/hash-password.mjs "your-password"
import { randomBytes, scryptSync } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your-password"');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
console.log(`${salt}:${hash}`);
