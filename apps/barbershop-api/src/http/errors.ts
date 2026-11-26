import type { ApiError } from "@intromax/barbershop-contracts";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";
import { postgresError } from "../db/errors";

/**
 * Throw from a handler to answer with this status and code, e.g.
 * `new HttpError(409, "slot_taken", "That time was just booked")`.
 * The message is shown to the client, so it must not contain internals.
 */
export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/** Throw from a handler to answer 404 `not_found`. */
export class NotFoundError extends HttpError {
  constructor(message = "Not found") {
    super(404, "not_found", message);
    this.name = "NotFoundError";
  }
}

export function errorBody(
  code: string,
  message: string,
  fields?: Record<string, string>,
): ApiError {
  return { error: { code, message, ...(fields && { fields }) } };
}

/** Codes for the client errors Fastify and its plugins raise themselves. */
const CLIENT_ERROR_CODES: Record<number, string> = {
  400: "bad_request",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  405: "method_not_allowed",
  408: "request_timeout",
  409: "conflict",
  413: "payload_too_large",
  415: "unsupported_media_type",
  429: "too_many_requests",
};

/**
 * Every error leaves the API as `{ error: { code, message, fields? } }`:
 * - a request that fails its zod schema: 422 `validation_failed`, with the
 *   failing fields;
 * - `HttpError` (and `NotFoundError`): its own status and code;
 * - any other client error (4xx), e.g. malformed JSON or a wrong
 *   Content-Type: its own status, reshaped;
 * - anything else: 500 with a generic message. The details go to the log
 *   only, so stack traces and SQL never reach the client.
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (hasZodFastifySchemaValidationErrors(error)) {
    const fields: Record<string, string> = {};
    for (const issue of error.validation) {
      // "/date" -> "date", "/hours/0/startsAt" -> "hours.0.startsAt"
      const path = issue.instancePath.slice(1).replaceAll("/", ".");
      fields[path || (error.validationContext ?? "request")] =
        issue.message ?? "Invalid value";
    }
    return reply
      .code(422)
      .send(errorBody("validation_failed", "Some fields are invalid", fields));
  }

  if (error instanceof HttpError) {
    return reply
      .code(error.statusCode)
      .send(errorBody(error.code, error.message));
  }

  const status = error.statusCode;
  if (status !== undefined && status >= 400 && status < 500) {
    return reply
      .code(status)
      .send(
        errorBody(CLIENT_ERROR_CODES[status] ?? "bad_request", error.message),
      );
  }

  request.log.error({ err: loggableError(error) }, "unhandled error");
  return reply.code(500).send(errorBody("internal", "Something went wrong"));
}

/**
 * What to log for an unexpected error. A failed query's error carries the
 * values it was run with (a guest's phone, name, notes) in its message, its
 * `params` and Postgres's `detail`, so for those only the SQL text, the
 * error code and the constraint are kept. Other errors are logged whole.
 */
export function loggableError(error: unknown): unknown {
  if (typeof error !== "object" || error === null || !("params" in error)) {
    return error;
  }
  const pg = postgresError(error);
  return {
    type: "QueryError",
    query: "query" in error ? error.query : undefined,
    code: pg?.code,
    constraint: pg?.constraint,
  };
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  // The path only: a query string can carry personal data.
  const path = request.url.split("?")[0];
  return reply
    .code(404)
    .send(errorBody("not_found", `No route for ${request.method} ${path}`));
}
