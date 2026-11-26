/** Postgres error codes (SQLSTATE) the API reacts to. */
export const PG_FOREIGN_KEY_VIOLATION = "23503";
export const PG_UNIQUE_VIOLATION = "23505";
export const PG_EXCLUSION_VIOLATION = "23P01";

/**
 * The Postgres error behind a failed query, if there is one. Drizzle wraps
 * the driver's error, so the code and constraint name sit on its `cause`.
 */
export function postgresError(
  error: unknown,
): { code: string; constraint?: string } | undefined {
  const candidate = (error as { cause?: unknown } | null)?.cause ?? error;
  if (
    typeof candidate === "object" &&
    candidate !== null &&
    "code" in candidate &&
    typeof candidate.code === "string"
  ) {
    return candidate as { code: string; constraint?: string };
  }
  return undefined;
}
