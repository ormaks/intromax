import { describe, expect, it } from "vitest";
import type { App } from "../app";
import { hashPassword } from "../auth/password";
import type { Db } from "../db/client";
import { withApp } from "../test/app";
import { addAdmin, NOW } from "../test/fixtures";

const PASSWORD = "a long admin password";
// Cheap hashing parameters keep the tests fast; the logic is the same.
const FAST = { ln: 10, r: 8, p: 1 };
const withFixedClock = { now: () => NOW };

async function adminWithPassword(db: Db) {
  return addAdmin(db, await hashPassword(PASSWORD, FAST));
}

function login(
  app: App,
  email: string,
  password: string,
  headers: Record<string, string> = {},
) {
  return app.inject({
    method: "POST",
    url: "/v1/auth/login",
    payload: { email, password },
    headers,
  });
}

function sessionCookie(res: Awaited<ReturnType<App["inject"]>>) {
  return res.cookies.find((cookie) => cookie.name === "session");
}

function me(app: App, token?: string) {
  return app.inject({
    method: "GET",
    url: "/v1/auth/me",
    ...(token && { cookies: { session: token } }),
  });
}

describe("login and me", () => {
  it("signs in, sets a locked-down cookie, and knows who you are", () =>
    withApp(async (app, db) => {
      const admin = await adminWithPassword(db);

      const res = await login(app, admin.email.toUpperCase(), PASSWORD);
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: "admin",
      });

      const cookie = sessionCookie(res);
      expect(cookie).toMatchObject({
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
      });

      const who = await me(app, cookie?.value);
      expect(who.statusCode).toBe(200);
      expect(who.json().id).toBe(admin.id);
    }, withFixedClock));

  it("answers a wrong password exactly like an unknown email", () =>
    withApp(async (app, db) => {
      const admin = await adminWithPassword(db);

      const wrongPassword = await login(app, admin.email, "not the password");
      const unknownEmail = await login(app, "nobody@example.com", PASSWORD);
      expect(wrongPassword.statusCode).toBe(401);
      expect(wrongPassword.json()).toEqual(unknownEmail.json());
      expect(wrongPassword.json().error.code).toBe("invalid_credentials");
      expect(sessionCookie(wrongPassword)).toBeUndefined();
    }, withFixedClock));

  it("answers 401 to me without a session", () =>
    withApp(async (app) => {
      const res = await me(app);
      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe("unauthorized");
    }, withFixedClock));

  it("ends the session on logout, so the old cookie stops working", () =>
    withApp(async (app, db) => {
      const admin = await adminWithPassword(db);
      const token = sessionCookie(
        await login(app, admin.email, PASSWORD),
      )?.value;

      const out = await app.inject({
        method: "POST",
        url: "/v1/auth/logout",
        cookies: { session: token ?? "" },
      });
      expect(out.statusCode).toBe(204);
      expect(sessionCookie(out)?.value).toBe("");

      expect((await me(app, token)).statusCode).toBe(401);
    }, withFixedClock));
});

describe("login rate limit", () => {
  it("answers 429 to the 6th attempt in 15 minutes", () =>
    withApp(async (app, db) => {
      const admin = await adminWithPassword(db);
      for (let i = 0; i < 5; i++) {
        expect((await login(app, admin.email, "wrong")).statusCode).toBe(401);
      }
      const blocked = await login(app, admin.email, PASSWORD);
      expect(blocked.statusCode).toBe(429);
    }, withFixedClock));

  it("ignores X-Forwarded-For unless the proxy's secret comes with it", () =>
    withApp(
      async (app, db) => {
        const admin = await adminWithPassword(db);
        // Forged: a new "IP" each time, but no secret, so one shared counter.
        for (let i = 0; i < 5; i++) {
          await login(app, admin.email, "wrong", {
            "x-forwarded-for": `203.0.113.${i}`,
          });
        }
        const forged = await login(app, admin.email, "wrong", {
          "x-forwarded-for": "203.0.113.99",
        });
        expect(forged.statusCode).toBe(429);

        // From the proxy: the forwarded IP is the guest's own counter.
        const proxied = await login(app, admin.email, "wrong", {
          "x-forwarded-for": "198.51.100.7, 10.0.0.1",
          "x-proxy-secret": "proxy-secret-for-tests",
        });
        expect(proxied.statusCode).toBe(401);
      },
      { ...withFixedClock, proxySecret: "proxy-secret-for-tests" },
    ));
});

describe("origin check", () => {
  it("rejects a state-changing request from another site", () =>
    withApp(
      async (app, db) => {
        const admin = await adminWithPassword(db);

        const foreign = await login(app, admin.email, PASSWORD, {
          origin: "https://evil.example",
        });
        expect(foreign.statusCode).toBe(403);
        expect(foreign.json().error.code).toBe("forbidden_origin");

        const ours = await login(app, admin.email, PASSWORD, {
          origin: "https://shop.example",
        });
        expect(ours.statusCode).toBe(200);
      },
      { ...withFixedClock, frontendOrigin: "https://shop.example" },
    ));
});
