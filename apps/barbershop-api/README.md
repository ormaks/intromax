# barbershop-api

The barbershop booking app's backend: a Node + TypeScript HTTP API on Fastify, with Postgres through Drizzle. The full product spec (data model, endpoints, auth, stages) is [`docs/specs/barbershop.md`](../../docs/specs/barbershop.md); this file is how the code works.

## Quick start

Needs Docker Desktop running. From the repo root:

```bash
cp apps/barbershop-api/.env.example apps/barbershop-api/.env
pnpm nx db:up barbershop-api        # Postgres 17 in Docker, host port 5433
pnpm nx db:migrate barbershop-api   # create the tables
pnpm nx db:seed barbershop-api      # the shop, opening hours, demo services and barbers
pnpm nx dev barbershop-api          # http://localhost:3001, restarts on change
```

```bash
curl localhost:3001/health
curl localhost:3001/v1/barbers
```

| Target                       | What it does                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `dev` / `start`              | Run the server with `tsx` (`dev` watches files)                                 |
| `test`                       | Vitest: unit tests, plus database tests against `DATABASE_URL`                  |
| `lint` / `typecheck`         | ESLint / `tsc --noEmit`                                                         |
| `db:up` / `db:down`          | Start / stop the Postgres container (data survives in a named volume)           |
| `db:generate` / `db:migrate` | Write a migration from `src/db/schema.ts` / apply pending migrations            |
| `db:seed`                    | Fill the shop and a demo catalogue; safe to re-run (never overwrites catalogue) |
| `create-admin`               | Create an admin account; asks for email, name and a hidden password             |

## How it fits together

```mermaid
flowchart LR
  FE["apps/barbershop<br/>(Next.js, B6)"] -- "/api/* proxy" --> API
  subgraph API["apps/barbershop-api"]
    direction TB
    R["routes/*<br/>Fastify plugins"] --> S["schedule/*<br/>pure logic"]
    R --> D["db/*<br/>Drizzle schema + client"]
  end
  C["modules/barbershop-contracts<br/>zod schemas + types"] -.-> FE
  C -.-> R
  D --> PG[("Postgres<br/>Docker locally, Neon in prod")]
```

- **`modules/barbershop-contracts`** is the single definition of every request and response. The API validates with it; the frontend types its client and validates its forms with the same file, so the two can't drift.
- **Routes are thin.** They validate (via the contract), query, call pure functions, and shape the response.
- **`schedule/` is pure**: no database, no clock, no globals. Everything time-related is unit-testable there.
- **The database is the last line of defence.** Checks, foreign keys and the `bookings_no_overlap` exclusion constraint hold even if API code has a bug.

## Folder layout

```
src/
  app.ts            buildApp({ db, now }): the Fastify app, not yet listening
  server.ts         the entry point: env, DB pool, listen on PORT, graceful shutdown
  env.ts            loadEnv() / requireEnv()
  http/errors.ts    the error envelope, error handler, 404 handler, HttpError
  http/auth.ts      session cookie, requireAdmin, the Origin check
  http/clientIp.ts  the client IP for rate limits (proxy-aware)
  routes/           one Fastify plugin per area: health, shop, catalogue,
                    availability, bookings; lookups.ts holds their shared reads
  admin/            admin-side queries: weekly hours, bookings to review, the bookings
                    table, overview and analytics numbers
  auth/             password hashing (scrypt), sessions, creating admins
  bookings/         reference codes, the guest lookup, the response view, and
                    assertBookable (the start rule shared by guests and admins)
  catalogue/        stored hours in the API's shape, shared by public and admin routes
  scripts/          create-admin and its terminal prompts
  schedule/         pure time logic: clock helpers, opening-hours check, freeSlots
  db/
    schema.ts       all tables, checks, enums (source for generated migrations)
    tstzrange.ts    custom column type: [start, end) range <-> { start, end }
    client.ts       createDb(url) -> { db, pool }; the Db type
    errors.ts       reading Postgres error codes out of Drizzle's errors
    seed.ts         demo data
  test/             shared test helpers: rolled-back transactions, withApp, fixtures
drizzle/            SQL migrations, committed and reviewed like code
```

## A request, end to end

`GET /v1/availability?serviceId=…&barberId=…&date=2026-12-01`

```mermaid
sequenceDiagram
  participant Client
  participant Fastify
  participant Route as routes/availability.ts
  participant PG as Postgres
  participant Slots as schedule/slots.ts

  Client->>Fastify: GET /v1/availability?…
  Fastify->>Fastify: validate query with the zod contract
  alt invalid
    Fastify-->>Client: 422 validation_failed + fields
  end
  Fastify->>Route: handler(query)
  Route->>PG: active service? active barber?
  alt missing
    Route-->>Client: 404 not_found
  end
  Route->>PG: barber's hours for that weekday
  alt day off
    Route-->>Client: 200 { slots: [] }
  end
  Route->>PG: shop timezone, live bookings overlapping that day
  Route->>Slots: freeSlots(date, tz, hours, duration, bookings, now)
  Slots-->>Route: [{ start, label }]
  Route->>Fastify: response
  Fastify->>Fastify: serialise through the contract (drops extra fields)
  Fastify-->>Client: 200 { slots }
```

## Booking a slot

`POST /v1/bookings` checks the start with the same `freeSlots` that availability uses (grid, hours, break, booking window), but with no bookings: other bookings are left to the database, the only place that can decide a race.

```mermaid
sequenceDiagram
  participant G as Guest
  participant R as routes/bookings.ts
  participant S as freeSlots
  participant PG as Postgres

  G->>R: POST /v1/bookings { serviceId, barberId, start, name, phone }
  R->>S: would this start be offered that day? (bookings: [])
  alt not offered
    R-->>G: 422 slot_unavailable
  end
  R->>PG: INSERT with a new reference, price and duration snapshots
  alt overlaps a live booking (23P01)
    R-->>G: 409 slot_taken
  else reference already used (23505)
    R->>PG: retry with a fresh reference (up to 3 tries)
  end
  R-->>G: 201 { reference, start, end, label, ... }
```

A guest then reaches the booking with `{ reference, phone }` in a POST body (never a query string, which ends up in logs):

- `/v1/bookings/lookup`: a wrong phone answers exactly like an unknown reference, 404.
- `/v1/bookings/cancel`: only a `confirmed` booking at least 2 hours away; otherwise 409 `not_cancellable`. The update is conditional on `status = 'confirmed'`, so two cancels arriving together can't both succeed.

**Rate limits** are per IP, in memory, opted into per route with `config.rateLimit`: booking 10 per hour, lookup and cancel 10 per minute each.

## Auth

One role, `admin`, created only by `create-admin`; there is no sign-up.

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as API
  participant PG as Postgres

  B->>A: POST /v1/auth/login { email, password }
  A->>PG: user by lower(email)
  A->>A: scrypt-verify (a dummy hash if no such user)
  alt wrong email or password
    A-->>B: 401 invalid_credentials
  end
  A->>PG: INSERT session id = sha256(token), expires in 30 days
  A-->>B: 200 user + Set-Cookie session=token (HttpOnly, Secure, SameSite=Lax)
  B->>A: GET /v1/auth/me (cookie)
  A->>PG: session by sha256(token), with its user
  Note over A: expired: delete, 401. Under 15 days left: extend, re-set cookie
  A-->>B: 200 user
```

- **Only the token's hash is stored,** so a leaked `sessions` table can't be turned into working cookies. A token is 32 random bytes, so a fast SHA-256 is enough; passwords are guessable, so they get the slow scrypt.
- **`requireAdmin`** (`http/auth.ts`) checks the session and sets `request.user`. Everything under `/v1/admin` gets it from one `onRequest` hook in `routes/admin/index.ts`, so an admin route can't be added without it, and a caller without a session gets 401 before any body is read.
- **CSRF:** `SameSite=Lax` keeps the cookie off cross-site POSTs, and every POST/PUT/PATCH/DELETE whose `Origin` isn't `FRONTEND_ORIGIN` gets 403 `forbidden_origin`.
- **Rate limits key on the client IP** (`http/clientIp.ts`). Behind the frontend's `/api` proxy that's `X-Forwarded-For`, believed only when the request carries `X-Proxy-Secret` matching `PROXY_SECRET`.

## Errors

Every error response has one shape:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Some fields are invalid",
    "fields": { "date": "Invalid ISO date" }
  }
}
```

`code` is stable and meant for code to branch on; `message` is for people and may change. The rules (`src/http/errors.ts`):

| Cause                                          | Status | `code`                                       |
| ---------------------------------------------- | ------ | -------------------------------------------- |
| Request fails its zod schema                   | 422    | `validation_failed`, with `fields`           |
| `throw new HttpError(status, code, message)`   | status | `code`, e.g. `slot_taken`, `not_cancellable` |
| `throw new NotFoundError()`, or no such route  | 404    | `not_found`                                  |
| Fastify's own client errors (bad JSON, 415, …) | as-is  | `bad_request`, `unsupported_media_type`, …   |
| A rate limit hit                               | 429    | `too_many_requests`                          |
| Anything else                                  | 500    | `internal` (details only in the log)         |

An `HttpError`'s message goes to the client as-is, so it never contains internals. A 500 is logged through `loggableError`: for a failed query that keeps only the SQL text, error code and constraint, because the query's values (a guest's phone, name, notes) ride along in the raw error.

## Time

Two kinds of time, never mixed:

- **Instants** (`timestamptz`, JS `Date`): bookings and "now".
- **Shop-clock times** (`time`, `"09:30"`): opening hours, barber hours, breaks. Read in `shop_settings.timezone`.

`freeSlots` walks the day in shop-clock minutes and converts to an instant in exactly one place, with `@date-fns/tz`, which applies the UTC offset in force on that date. That's what makes DST days correct. Ranges are half-open `[start, end)`, so back-to-back bookings don't overlap.

## Database workflow

1. Edit `src/db/schema.ts`.
2. `db:generate` writes a new SQL file in `drizzle/`. Read it.
3. `db:migrate` applies it.

Never use `drizzle-kit push`: Drizzle doesn't know about the hand-written `bookings_no_overlap` constraint (`drizzle/0001_…`) and would drop it.

## Tests

- **Unit tests** for pure logic sit next to it (`schedule/*.test.ts`, `bookings/reference.test.ts`).
- **Database and HTTP tests** run against the real local Postgres. Each runs inside a Drizzle transaction that is always rolled back (`test/db.ts`), so they leave the seeded dev data untouched; a route's own transaction becomes a savepoint inside it. HTTP tests go through `app.inject()` (`test/app.ts`): real routing, validation and serialisation, no open port. They pass a fixed `now`, so time-based rules are repeatable.
- The database must be up and migrated first (`db:up`, `db:migrate`).

## Adding an endpoint

1. Add its request/response schemas to `modules/barbershop-contracts`.
2. Add a route in a plugin under `src/routes/` with `schema: { querystring | body, response }` from the contract, and register it in `app.ts` under `/v1`.
3. Keep logic that doesn't need the database in a pure function, with a unit test.
4. Add an `app.inject()` test for its happy path and its failure statuses.

## Environment

| Name              | Purpose                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | Postgres connection string                                                                      |
| `PORT`            | Port to listen on; optional, defaults to 3001                                                   |
| `FRONTEND_ORIGIN` | The origin allowed to send state-changing browser requests; defaults to `http://localhost:3000` |
| `PROXY_SECRET`    | Shared with the `/api` proxy; only then is `X-Forwarded-For` trusted. Optional                  |
