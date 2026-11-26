import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/*
 * Passwords are hashed with scrypt, which is deliberately slow and
 * memory-hard: each guess at a stolen hash costs ~128 MiB and a noticeable
 * fraction of a second, so cracking at scale is expensive.
 *
 * Stored in the PHC string format, which records its own parameters:
 *   $scrypt$ln=17,r=8,p=1$<salt>$<hash>      (salt and hash in base64)
 * `ln` is log2 of N. Verifying reads the parameters back from the string, so
 * the cost can be raised later without breaking passwords already stored.
 */

export type ScryptParams = { ln: number; r: number; p: number };

/** OWASP's recommended minimum: N = 2^17, r = 8, p = 1 (128 MiB). */
export const DEFAULT_PARAMS: ScryptParams = { ln: 17, r: 8, p: 1 };

const SALT_BYTES = 16;
const KEY_BYTES = 64;

export async function hashPassword(
  password: string,
  params: ScryptParams = DEFAULT_PARAMS,
): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, KEY_BYTES, params);
  return `$scrypt$ln=${params.ln},r=${params.r},p=${params.p}$${b64(salt)}$${b64(key)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const { params, salt, key } = parse(stored);
  const candidate = await derive(password, salt, key.length, params);
  // Compares every byte whatever the result, so the time taken doesn't
  // reveal how much of the hash matched.
  return timingSafeEqual(candidate, key);
}

function derive(
  password: string,
  salt: Buffer,
  keyBytes: number,
  { ln, r, p }: ScryptParams,
): Promise<Buffer> {
  const N = 2 ** ln;
  return new Promise((resolve, reject) => {
    // Runs on libuv's thread pool, so the event loop keeps serving other
    // requests meanwhile. maxmem must exceed scrypt's 128 * N * r bytes;
    // Node's default (32 MiB) is below what N = 2^17 needs.
    scrypt(
      password,
      salt,
      keyBytes,
      { N, r, p, maxmem: 256 * N * r },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

function parse(stored: string) {
  const match = /^\$scrypt\$ln=(\d+),r=(\d+),p=(\d+)\$([^$]+)\$([^$]+)$/.exec(
    stored,
  );
  if (!match) throw new Error("Stored password hash isn't in scrypt format");
  const [, ln = "", r = "", p = "", salt = "", key = ""] = match;
  return {
    params: { ln: Number(ln), r: Number(r), p: Number(p) },
    salt: Buffer.from(salt, "base64"),
    key: Buffer.from(key, "base64"),
  };
}

/** Base64 without the `=` padding, as PHC strings write it. */
function b64(bytes: Buffer) {
  return bytes.toString("base64").replace(/=+$/, "");
}
