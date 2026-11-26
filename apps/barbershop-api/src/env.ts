import { existsSync } from "node:fs";

/**
 * Loads `.env` from the current directory into `process.env`, if it exists.
 * Nx runs every target from the app folder, so that's where `.env` lives.
 */
export function loadEnv() {
  if (existsSync(".env")) process.loadEnvFile(".env");
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env.`);
  return value;
}
