import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { App } from "./app";
import { withApp } from "./test/app";

describe("GET /health", () => {
  it("answers 200 when the database is reachable", () =>
    withApp(async (app) => {
      const res = await app.inject({ method: "GET", url: "/health" });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ ok: true });
    }));
});

describe("error responses", () => {
  /** Adds routes that fail in known ways, to exercise the error handler. */
  function withFailingRoutes(app: App) {
    app.post(
      "/test/echo",
      { schema: { body: z.object({ name: z.string().min(1) }) } },
      async (request) => request.body,
    );
    app.get("/test/crash", async () => {
      throw new Error('relation "secret_table" does not exist');
    });
  }

  it("answers 404 in the error shape for an unknown route", () =>
    withApp(async (app) => {
      const res = await app.inject({ method: "GET", url: "/nope?phone=123" });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({
        error: { code: "not_found", message: "No route for GET /nope" },
      });
    }));

  it("answers 422 with the failing fields when a body fails its schema", () =>
    withApp(async (app) => {
      withFailingRoutes(app);
      const res = await app.inject({
        method: "POST",
        url: "/test/echo",
        payload: { name: "" },
      });
      expect(res.statusCode).toBe(422);
      expect(res.json().error.code).toBe("validation_failed");
      expect(Object.keys(res.json().error.fields)).toEqual(["name"]);
    }));

  it("keeps Fastify's own 400 for malformed JSON", () =>
    withApp(async (app) => {
      withFailingRoutes(app);
      const res = await app.inject({
        method: "POST",
        url: "/test/echo",
        headers: { "content-type": "application/json" },
        payload: "{ not json",
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe("bad_request");
    }));

  it("answers a generic 500 that leaks nothing for an unexpected error", () =>
    withApp(async (app) => {
      withFailingRoutes(app);
      const res = await app.inject({ method: "GET", url: "/test/crash" });
      expect(res.statusCode).toBe(500);
      expect(res.json()).toEqual({
        error: { code: "internal", message: "Something went wrong" },
      });
    }));
});
