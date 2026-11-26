import { z } from "zod";
import { id } from "./common";

export const loginRequest = z.object({
  email: z.email(),
  // Only checked against the stored hash; length rules apply when an
  // account is created.
  password: z.string().min(1).max(200),
});
export type LoginRequest = z.input<typeof loginRequest>;

/** The signed-in user, from login and GET /v1/auth/me. */
export const currentUser = z.object({
  id,
  email: z.string(),
  name: z.string(),
  role: z.enum(["admin"]),
});
export type CurrentUser = z.infer<typeof currentUser>;
