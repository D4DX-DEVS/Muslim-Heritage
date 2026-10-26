/**
 * Prints an ADMIN_PASSWORD_HASH for the given password.
 *   node scripts/hash-password.mts 'correct horse battery staple'
 * Store the output as a secret: `wrangler secret put ADMIN_PASSWORD_HASH`.
 */
import { hashPassword } from "../src/lib/auth/password.ts";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Usage: node scripts/hash-password.mts '<password of 12+ characters>'");
  process.exit(1);
}
console.log(await hashPassword(password));
