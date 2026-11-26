import { existsSync } from "node:fs";

/**
 * Loads `.env` from the current directory into `process.env`, if it exists.
 * Nx runs every target from the app folder, so that's where `.env` lives.
 */
export function loadEnv() {
  if (existsSync(".env")) process.loadEnvFile(".env");
}

/**
 * An optional origin such as `https://shop.example`, normalised the way
 * browsers send the Origin header (no path, no trailing slash). A value that
 * isn't a URL stops startup rather than silently rejecting every request.
 */
export function optionalOrigin(name: string): string | undefined {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`${name} must be a URL such as https://shop.example`);
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env.`);
  return value;
}
