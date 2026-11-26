import { randomInt } from "node:crypto";

/** Crockford's base32: digits and capitals without I, L, O and U. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * A new booking reference, e.g. "K7M2-9QXA": 8 characters, 32^8 (about 10^12)
 * possibilities. `randomInt` draws from the OS's secure random source, so
 * references can't be predicted from earlier ones.
 */
export function newReference(): string {
  let code = "";
  for (let i = 0; i < 8; i++) code += ALPHABET.charAt(randomInt(32));
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
