# Spec: Barbershop booking app

Umbrella spec for the barbershop pet project. It covers the whole build and is delivered in the stages listed under [Stages](#stages) (barbershop track B1-B8 in `docs/PROGRESS.md`). Each stage implements against this spec. If a stage decides something this spec doesn't cover, that stage updates the spec and records the decision in PROGRESS.

## What

A barbershop booking app with a real backend. Guests book a service with a barber in a free time slot. One admin role manages bookings, services, barbers and working hours, and sees simple analytics.

- `apps/barbershop`: the frontend, in Next.js, using `modules/ui` and `modules/config`.
- `apps/barbershop-api`: a Node + TypeScript API on **Fastify**.
- `modules/barbershop-contracts`: request and response schemas and types that both apps import.
- **Postgres** (**Neon** in production, Docker locally), accessed with **Drizzle ORM**.

## Why

This rebuilds an earlier frontend-only version. That version was React + Vite with everything in `localStorage` and a hard-coded admin password. The point of the rebuild is to **learn backend**: a Node server, a relational schema with real constraints, and session auth. So the backend is explained step by step as it is built, and design takes second place.

## Scope

**In scope:**

- **Landing page:**
  - a hero with stats
  - a services grid
  - barbers with their schedules
  - testimonials
  - "why choose us"
  - contact details and opening hours
  - a final call to action and a footer

  Services, barbers, the shop's details and opening hours come from the API. Stats, testimonials and "why choose us" are static copy in the frontend.

- **Guest booking:**
  - Pick a service, then a barber, a date and a free slot.
  - Enter details: name and phone, plus an optional email and notes.
  - A confirmation page shows the booking reference.
- **Manage a booking as a guest:** look a booking up by reference + phone, and cancel it.
- **Admin** (the only authenticated role):
  - Overview: today's bookings, today's revenue, upcoming bookings, top service.
  - Bookings table: edit, cancel, complete.
  - Services CRUD.
  - Barbers CRUD, including weekly working hours with an optional break per day.
  - Simple analytics charts.
- **Slot generation:**
  - Slots sit on a 15-minute grid inside the barber's working hours.
  - Breaks and existing bookings are excluded.
  - A slot is offered only if the whole service duration fits.
- **Database rules:**
  - Bookings snapshot the service's price and duration.
  - Booking times are `tstzrange`, prices are integer cents.
  - Double-booking is prevented by a Postgres exclusion constraint, not only by the UI.
- **Real auth:** argon2id-hashed passwords and server-side sessions in Postgres, behind an HTTP-only cookie.
- **Design:** existing `modules/ui` components. The old CSS animations (barber pole, shimmer, grain, marquee) are optional extras.

**Out of scope:**

- Customer accounts and barber logins. The schema leaves room for both; see [Later](#later).
- Sign-up, password reset, and admin user management UI. The admin is created by a CLI script.
- Payments, deposits and tipping.
- SMS or email notifications and reminders.
- Barber time off, holidays, and per-barber service lists. Every barber does every service.
- Overnight shifts (a working day that crosses midnight).
- Admin-created bookings (walk-ins), rescheduling by the customer, a no-show status.
- Multiple shops or locations, and multiple currencies (USD only).
- A pixel-perfect match of the old design.

## Roles

| Who     | Account?             | Can do                                                                                                              |
| ------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Visitor | No                   | Read the shop details, services, barbers and opening hours. See free slots.                                         |
| Guest   | No                   | Create a booking with name + phone. Look up or cancel **their** booking with the reference + the same phone number. |
| Admin   | Yes (`role = admin`) | Everything under `/v1/admin/*`.                                                                                     |
| Barber  | No (data only)       | Nothing. Barbers are rows the admin manages.                                                                        |

**Why reference + phone, not reference alone:** the reference is shown on screen and might end up in a screenshot or a shared chat. Requiring the phone number as well means knowing the reference alone isn't enough to cancel someone's appointment. It isn't real authentication, so lookup and cancel are also rate-limited, and a wrong reference and a wrong phone get the same "not found" answer. That way an attacker can't tell which of the two was right.

## User flows

### Guest books

1. **Landing → Book.** `GET /v1/services` lists active services, and the guest picks one. A "Book with James" button on a barber card preselects that barber.
2. **Barber.** `GET /v1/barbers` lists active barbers with their weekly hours, and the guest picks one. Days the barber doesn't work are greyed out in the date picker, using those hours, before any slot request.
3. **Date → slots.** `GET /v1/availability?serviceId&barberId&date` returns the free start times for that day. The guest picks one.
4. **Details:** name, phone, optional email and notes. The form is validated by the same schema the API uses.
5. **Submit.** `POST /v1/bookings`. Three outcomes:
   - **201:** the confirmation page shows the reference (e.g. `K7M2-9QXA`), the service, barber, time and price.
   - **409 `slot_taken`:** someone booked the slot in the meantime. The UI says so, reloads the slots and returns to step 3 with the guest's details kept.
   - **422:** `validation_failed` (a field is wrong; `fields` says which) or `slot_unavailable` (the time is no longer bookable, e.g. it's now less than an hour away). The UI shows the error.
   - **429:** too many bookings from this IP in the last hour.

### Guest looks up or cancels

1. **`/lookup`:** enter the reference + phone, which sends `POST /v1/bookings/lookup` and shows the booking and its status.
2. **Cancel:** `POST /v1/bookings/cancel` with the same pair. It's allowed only while the booking is `confirmed` and starts at least 2 hours from now; otherwise 409 `not_cancellable`, and the UI suggests calling the shop.

### Admin

1. **`/admin/login`:** `POST /v1/auth/login` sets the session cookie. Every admin page checks `GET /v1/auth/me` and sends the visitor to login on a 401.
2. **Overview:** `GET /v1/admin/overview`.
3. **Bookings:** filter by date range, status, barber and a search over name, phone and reference. From the table the admin can:
   - edit a booking (customer details, notes, barber, service, time)
   - cancel it, or mark it completed
4. **Services and barbers:** list (inactive ones included), create, edit, deactivate, or delete. Delete works only when nothing references the row (see [Deleting](#deleting-vs-deactivating)).
5. **A barber's hours:** a week grid. Each day is either off, or start and end times with an optional break. Saving replaces the whole week.
6. **Analytics:** pick a date range and see bookings per day, revenue per day, bookings by service, and bookings by barber.
7. **Logout:** `POST /v1/auth/logout`.

## Data model

Every table gets a `uuid` primary key, `gen_random_uuid()` by default (built into Postgres 13+). The exceptions are the singleton and composite-keyed tables below. Timestamps are `timestamptz`. Money is integer cents.

```
users ──< sessions
users ──< bookings (user_id, nullable, unused in MVP)
barbers ──< barber_working_hours (one row per working weekday)
barbers ──< bookings >── services
shop_settings (single row)      opening_hours (one row per open weekday)
```

### Three basics behind every choice below

- **`timestamptz` is an instant, `time` is a wall-clock reading.**
  - `timestamptz` stores an exact moment, normalised to UTC. "This booking starts at 14:00 New York time on 3 March" is an instant, so bookings use it.
  - "James works 09:00-18:00 on Mondays" isn't an instant. It means 09:00 local time every Monday, before and after daylight saving changes. So schedules use plain `time` and the shop's timezone. The API turns "date + local time + timezone" into an instant only when it needs one, which happens in slot generation.
  - The API does that conversion with `@date-fns/tz`, which applies the UTC offset in force on that date, so DST days come out right.
- **Integer cents, not decimals or floats.** `0.1 + 0.2 !== 0.3` in JavaScript. A `numeric` column comes back from the driver as a string, to avoid exactly that problem. Integer cents (`2500` = $25.00) are exact, sum correctly, and arrive as plain JS numbers. Formatting to `$25.00` happens only at the edge, in the UI.
- **Constraints live in the database, not only the API.** The API validates everything first, to give friendly errors. But the database is the last line of defence: it holds even if there's a bug in the API, a second API instance, a seed script, or a hand-written SQL fix. The rules that can be stated about a single row, or about rows of the same table, are written as DB constraints. Rules that need other tables, such as "inside working hours", stay in the API.

### `users`

| Column          | Type          | Notes                                    |
| --------------- | ------------- | ---------------------------------------- |
| `id`            | `uuid` PK     |                                          |
| `email`         | `text`        | not null; unique index on `lower(email)` |
| `password_hash` | `text`        | not null; argon2id PHC string            |
| `name`          | `text`        | not null                                 |
| `role`          | `user_role`   | not null; enum with one value: `'admin'` |
| `created_at`    | `timestamptz` | not null, default `now()`                |
| `updated_at`    | `timestamptz` | not null, default `now()`                |

- **The unique index on `lower(email)`** makes `Admin@x.com` and `admin@x.com` the same account. A plain `UNIQUE (email)` would let both exist. The alternative is the `citext` extension, but one expression index is simpler than a new extension.
- **`role` is a Postgres enum**, so the database rejects any value it doesn't know.
  - Adding `'barber'` and `'customer'` later is one line: `ALTER TYPE user_role ADD VALUE ...`.
  - The trade-off: removing a value from an enum is awkward, so values should only ever be added. That fits here.
- **`password_hash` holds the PHC string** (`$argon2id$v=19$m=...,t=...,p=...$salt$hash`). The salt and the cost settings live inside the string, so stronger settings can be adopted later and old hashes still verify. The plain password never touches the database.

### `sessions`

| Column       | Type          | Notes                                                       |
| ------------ | ------------- | ----------------------------------------------------------- |
| `id`         | `text` PK     | SHA-256 (hex) of the session token. Never the token itself. |
| `user_id`    | `uuid` FK     | → `users.id`, `ON DELETE CASCADE`; indexed                  |
| `expires_at` | `timestamptz` | not null                                                    |
| `created_at` | `timestamptz` | not null, default `now()`                                   |

- **Why store a hash of the token.** The browser holds a random token, and the database holds only `sha256(token)`. If the database leaks (a backup, a log), nobody can use those rows to log in, because they can't reverse the hash back into a token. SHA-256 is enough here, unlike for passwords: the token is 32 random bytes, so there's nothing to brute-force.
- **`ON DELETE CASCADE`:** deleting a user deletes their sessions too. A session without its user is meaningless.

### `shop_settings` (exactly one row)

| Column     | Type         | Notes                                                            |
| ---------- | ------------ | ---------------------------------------------------------------- |
| `id`       | `boolean` PK | default `true`, `CHECK (id)`. This is what makes it a singleton. |
| `name`     | `text`       | "The Royal Cut"                                                  |
| `timezone` | `text`       | IANA name, e.g. `America/New_York`                               |
| `phone`    | `text`       |                                                                  |
| `email`    | `text`       |                                                                  |
| `address`  | `text`       | multi-line                                                       |

- **The singleton trick:** the primary key is a boolean that must be `true`. A second row would need another `true` key, which the PK forbids, so the table can only ever hold one row.
- **The timezone lives in the data, not in code**, because slot generation and "today" in the admin overview both depend on it.
- **Seeded, with no admin UI in the MVP.**

### `opening_hours`

| Column      | Type          | Notes                                         |
| ----------- | ------------- | --------------------------------------------- |
| `weekday`   | `smallint` PK | `CHECK (weekday BETWEEN 0 AND 6)`, 0 = Sunday |
| `opens_at`  | `time`        | not null                                      |
| `closes_at` | `time`        | not null, `CHECK (opens_at < closes_at)`      |

- **No row means closed** that day, so there's no `is_closed` flag that could contradict the times.
- **0 = Sunday** matches both JavaScript's `Date#getDay()` and Postgres's `extract(dow ...)`, so nothing needs translating.
- **Opening hours bound barber hours.** They're shown on the landing page and are the outer limit for every barber's working day. The API rejects barber hours outside them on save, so the site can never say "Sunday: closed" while offering Sunday slots.
  - This rule lives in the API, not the database. A `CHECK` can only see its own row, and this rule compares two tables.
  - Slot generation only needs the barber's hours, because those are already inside the opening hours.

### `services`

| Column             | Type          | Notes                                                   |
| ------------------ | ------------- | ------------------------------------------------------- |
| `id`               | `uuid` PK     |                                                         |
| `name`             | `text`        | not null, `CHECK (char_length(name) BETWEEN 1 AND 100)` |
| `description`      | `text`        | nullable                                                |
| `duration_minutes` | `integer`     | not null, `CHECK (duration_minutes BETWEEN 5 AND 480)`  |
| `price_cents`      | `integer`     | not null, `CHECK (price_cents >= 0)`                    |
| `is_active`        | `boolean`     | not null, default `true`                                |
| `sort_order`       | `integer`     | not null, default `0`                                   |
| `created_at`       | `timestamptz` | not null, default `now()`                               |
| `updated_at`       | `timestamptz` | not null, default `now()`                               |

- **Duration isn't forced onto the 15-minute grid.** Only start times are. A 20-minute service starting at 10:00 frees the barber at 10:20, and the next start on the grid is 10:30.
- **`sort_order`** lets the admin control the order of the grid without renaming things.

### `barbers`

| Column       | Type          | Notes                          |
| ------------ | ------------- | ------------------------------ |
| `id`         | `uuid` PK     |                                |
| `name`       | `text`        | not null                       |
| `title`      | `text`        | e.g. "Senior Barber", nullable |
| `bio`        | `text`        | nullable                       |
| `photo_url`  | `text`        | nullable                       |
| `is_active`  | `boolean`     | not null, default `true`       |
| `sort_order` | `integer`     | not null, default `0`          |
| `created_at` | `timestamptz` | not null, default `now()`      |
| `updated_at` | `timestamptz` | not null, default `now()`      |

### `barber_working_hours`

| Column            | Type       | Notes                                         |
| ----------------- | ---------- | --------------------------------------------- |
| `barber_id`       | `uuid` FK  | → `barbers.id`, `ON DELETE CASCADE`           |
| `weekday`         | `smallint` | `CHECK (weekday BETWEEN 0 AND 6)`, 0 = Sunday |
| `starts_at`       | `time`     | not null                                      |
| `ends_at`         | `time`     | not null                                      |
| `break_starts_at` | `time`     | nullable                                      |
| `break_ends_at`   | `time`     | nullable                                      |

Primary key `(barber_id, weekday)`.

```sql
CHECK (starts_at < ends_at),
CHECK ((break_starts_at IS NULL) = (break_ends_at IS NULL)),
CHECK (break_starts_at IS NULL
       OR (starts_at < break_starts_at
           AND break_starts_at < break_ends_at
           AND break_ends_at < ends_at))
```

- **One row per working day, no row = day off.** The old app had one set of hours for all working days. Per-day rows also allow "Saturday 10-17". They cost nothing extra, because the admin UI can still offer "same hours every day".
- **The composite primary key `(barber_id, weekday)`** is the rule "at most one schedule per barber per weekday", enforced by the key itself. No surrogate `id` is needed.
- **The checks, in words:**
  - The day starts before it ends.
  - A break has both ends or neither.
  - A break sits strictly inside the working day.
  - `starts_at < ends_at` also rules out overnight shifts, which is deliberate (see Out of scope).
- **`ON DELETE CASCADE`:** a schedule belongs to its barber and goes with them.
- **Plain `time`, not `timetz`.** The Postgres docs themselves advise against `timetz`: a UTC offset without a date can't account for daylight saving.

### `bookings`

The core table, written as the SQL the migration will contain:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE booking_status AS ENUM ('confirmed', 'completed', 'cancelled');

CREATE TABLE bookings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        text NOT NULL UNIQUE,
  barber_id        uuid NOT NULL REFERENCES barbers (id) ON DELETE RESTRICT,
  service_id       uuid NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
  user_id          uuid REFERENCES users (id) ON DELETE SET NULL,
  during           tstzrange NOT NULL,
  status           booking_status NOT NULL DEFAULT 'confirmed',
  price_cents      integer NOT NULL CHECK (price_cents >= 0),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  customer_name    text NOT NULL CHECK (char_length(customer_name) BETWEEN 1 AND 100),
  customer_phone   text NOT NULL,
  customer_email   text,
  notes            text,
  cancelled_at     timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  -- a finite, non-empty [start, end) range
  CONSTRAINT bookings_during_shape CHECK (
    NOT isempty(during)
    AND NOT lower_inf(during) AND NOT upper_inf(during)
    AND lower_inc(during) AND NOT upper_inc(during)
  ),
  -- the range is exactly as long as the duration snapshot
  CONSTRAINT bookings_during_matches_duration CHECK (
    upper(during) - lower(during) = make_interval(mins => duration_minutes)
  ),
  -- the timestamps agree with the status
  CONSTRAINT bookings_cancelled_at_matches_status CHECK (
    (status = 'cancelled') = (cancelled_at IS NOT NULL)
  ),
  CONSTRAINT bookings_completed_at_matches_status CHECK (
    (status = 'completed') = (completed_at IS NOT NULL)
  ),
  -- no two live bookings for one barber may overlap
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    barber_id WITH =,
    during    WITH &&
  ) WHERE (status <> 'cancelled')
);
```

**Column by column:**

- **`reference`** is the "booking ID" the guest sees, e.g. `K7M2-9QXA`. It's separate from `id` on purpose:
  - `id` is an internal key: long, and used in admin URLs.
  - `reference` is short and readable. It's 8 characters from Crockford's base32, which leaves out the look-alikes `I L O U`. That gives 32⁸ ≈ 10¹² combinations, so guessing one is hopeless, and lookups are rate-limited on top of that.
  - `UNIQUE` guarantees no two bookings share one. On the astronomically rare collision, the insert fails and the API retries with a new code.
- **`during tstzrange`** is the appointment as a single value: a range of instants.
  - **Half-open, `[start, end)`.** The start is included and the end isn't. So a 10:00-10:30 booking and a 10:30-11:00 booking don't overlap: the barber is free _at_ 10:30. With closed ranges `[ ]`, back-to-back bookings would count as overlapping. The `bookings_during_shape` check makes every row use this shape.
  - **Why a range rather than two columns.** The exclusion constraint below needs a range. "Do these overlap?" then becomes the `&&` operator. It also replaces the classic, easy-to-get-wrong check `a.start < b.end AND b.start < a.end`.
  - **The trade-off:** Drizzle has no built-in `tstzrange` type. The schema declares a small custom column type, and the API converts to and from `{ start, end }` at the boundary, so the rest of the code never sees range syntax.
- **`price_cents` and `duration_minutes` are snapshots.** They're copied from the service at the moment of booking. If the admin raises the Skin Fade price next month, last month's bookings and revenue stay what they were.
  - The service's **name** is not snapshotted. A renamed service shows its new name in history, which is acceptable for a single shop.
  - `bookings_during_matches_duration` ties the snapshot to the range, so they can't drift apart.
  - Postgres does `timestamptz` subtraction in elapsed time, so DST doesn't break this check.
- **`status`** is an enum. The transitions are enforced in the API:
  - `confirmed` → `completed`
  - `confirmed` → `cancelled`
  - both end states are final

  `cancelled_at` and `completed_at` record when it happened, and the two checks keep them consistent with `status`. For example, a `cancelled` row without `cancelled_at` is impossible.

- **`user_id`** is nullable and always `NULL` in the MVP. It's here so customer accounts can be added later without migrating existing rows (see [Later](#later)). `ON DELETE SET NULL` means that deleting a user keeps the business history and just forgets whose it was.
- **`customer_*`:** guests have no account, so their details live on the booking itself.
  - `customer_phone` is stored **normalised**: a leading `+` and digits only. So `+1 (555) 234-5678` and `+15552345678` compare equal in the lookup.
  - How much normalising to do is an [open question](#open-questions).

**The foreign keys:**

- **`ON DELETE RESTRICT` on `barber_id` and `service_id`.** Postgres refuses to delete a barber or service that any booking points to. History can't lose its barber.

**The exclusion constraint, in plain words.** `bookings_no_overlap` says: no two rows may have the same `barber_id` **and** overlapping `during`, ignoring cancelled rows.

- **What it's like.** It works like a `UNIQUE` constraint, but with "overlaps" in place of "equals" for one of the columns.
- **How it works.** Postgres keeps a GiST index on `(barber_id, during)`. On every insert or update it uses that index to look for a conflicting row, and fails with error code `23P01` if it finds one.
- **Why `btree_gist`.** GiST indexes natively understand ranges (`&&`), but not plain equality on a `uuid`. The `btree_gist` extension teaches GiST to do `=` too, so both columns fit in one constraint. It ships with Postgres and is available on Neon.
- **`WHERE (status <> 'cancelled')`** makes it a _partial_ constraint: a cancelled booking frees its slot immediately. Completed bookings still count, which is harmless because they're in the past.
- **Why it matters (the race condition).** Two guests load the slots, both see 10:00 free, and both press Book within the same second.
  - A UI-only check can't stop this.
  - An API-only "SELECT then INSERT" check can't either: both requests run the SELECT before either INSERT lands.
  - The constraint is checked _inside_ the database at insert time, under the right locks. So exactly one insert succeeds, and the other gets `23P01`.
  - The API turns that error into `409 slot_taken`, and the UI reloads the slots.
- **The bonus.** The same GiST index also makes "this barber's bookings on this day" fast, and that query is the heart of slot generation.

**Rules that stay in the API**, because they involve other tables or "now":

- The slot is on the 15-minute grid, in shop local time.
  - This can't be a `CHECK`: it would have to read `shop_settings.timezone`.
  - And extracting minutes from a `timestamptz` depends on the session timezone, so the result would vary from connection to connection.
- The slot is inside the barber's working hours and not inside their break.
- A barber's working hours sit inside the shop's opening hours for that weekday (checked when the hours are saved).
- The barber and the service are active.
- The start isn't in the past, and isn't beyond the booking horizon.
- Status transitions, and "a guest can only cancel a future, confirmed booking".

### Deleting vs deactivating

Services and barbers have `is_active`. Inactive ones disappear from the public site and the booking flow but remain in history and in the admin lists.

`DELETE /v1/admin/services/:id` (and the same for barbers) really deletes the row. Because of `ON DELETE RESTRICT`, Postgres refuses when any booking references it, and the API turns that refusal into `409 in_use` with "deactivate it instead". So deleting is only possible for things created by mistake. History is protected by the database, not by remembering to check.

### `updated_at`

Drizzle sets `updated_at` on every update it issues (`$onUpdate`). A Postgres trigger would also cover hand-written SQL, but triggers are one more concept to learn up front. They can be added later if it ever matters.

### Seed data

Matches the old app's data, so the rebuilt site looks the same out of the box:

- **Shop:** "The Royal Intromax Cut", `America/New_York`, the old contact details.
- **Opening hours:** Mon 09:00-19:00, Tue-Sat 08:00-19:00, Sun 08:00-17:00. That's the span of the barbers' hours below, so every barber's day fits inside it.
- **Eight services:**

  | Service               | Price | Duration |
  | --------------------- | ----- | -------- |
  | Classic Haircut       | $25   | 30 min   |
  | Skin Fade             | $30   | 45 min   |
  | Beard Trim            | $15   | 15 min   |
  | Haircut + Beard Combo | $40   | 60 min   |
  | Kids Haircut          | $20   | 30 min   |
  | Hot Towel Shave       | $25   | 30 min   |
  | Hair Coloring         | $50   | 60 min   |
  | VIP Grooming Package  | $70   | 90 min   |

- **Three barbers:**
  - James Carter: Mon-Fri 09-18, break 13-14.
  - Marcus Johnson: Mon-Sat 10-19, break 14-15.
  - David Williams: Tue-Sun 08-17, break 12-13.

  The old app's opening hours (Mon-Fri 09-19, Sat 10-17, Sunday closed) contradicted these barbers in three places: David starts at 08:00, works Sundays, and Marcus works until 19:00 on Saturdays. Since opening hours now bound barber hours, the seed widens the opening hours instead of cutting the barbers' days.
  - The seed script (`db:seed`) checks every barber's hours with the same function the API uses (`weekdaysOutsideOpeningHours`) before writing anything, so an inconsistent seed fails loudly.
  - It's safe to run again. The shop row and opening hours are always rewritten, because nothing references them. The demo services and barbers go in only while both tables are empty, so the admin's own rows, and the bookings pointing at them, are never touched.

## Slot generation

`GET /v1/availability?serviceId&barberId&date=YYYY-MM-DD` (the date is in shop local time):

1. **Load** the service (its duration), the barber's row in `barber_working_hours` for that weekday, and the shop timezone. If there's no row, the barber isn't working that day: return `[]`.
2. **Build candidate start times** every 15 minutes from `starts_at`, rounded up to the grid (:00, :15, :30, :45). Keep a candidate only if `start + duration <= ends_at`, so the whole service fits before closing.
3. **Drop** any candidate whose `[start, start + duration)` overlaps the break.
4. **Turn the remaining local times into instants** in the shop timezone, then drop any candidate that overlaps an existing non-cancelled booking. One query fetches the barber's bookings for that day, using the GiST index. Also drop any start that has already passed, or that is beyond the booking horizon.
5. **Return the free starts** as ISO instants, plus a local `HH:mm` label for display.

Steps 2-4 are a pure function, `(hours, break, bookings, duration, now) → slots`, which is easy to unit-test without a database. The response is a hint, not a promise: the exclusion constraint is the final word when the booking is created. The timezone conversion happens inside that function, with `@date-fns/tz`, so a DST day is a plain unit test.

## API

Fastify, JSON in and out, all routes under `/v1`. Request and response schemas come from `modules/barbershop-contracts` (zod), so one definition does three jobs:

- it validates requests in the API
- it types the frontend's API client
- it validates the frontend's forms

Errors share one shape: `{ error: { code, message, fields? } }`.

**Public** (no session):

| Method | Path                  | Purpose                                                                                                                          |
| ------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/health`             | Liveness for the host (also checks the DB connection).                                                                           |
| GET    | `/v1/shop`            | Shop name, timezone, contact details, opening hours.                                                                             |
| GET    | `/v1/services`        | Active services, in `sort_order`.                                                                                                |
| GET    | `/v1/barbers`         | Active barbers with their weekly hours.                                                                                          |
| GET    | `/v1/availability`    | `?serviceId&barberId&date`: free start times (see above).                                                                        |
| POST   | `/v1/bookings`        | Create a guest booking. 201 with the reference, 409 `slot_taken`, 422 `slot_unavailable` or `validation_failed`. Rate-limited.   |
| POST   | `/v1/bookings/lookup` | `{ reference, phone }`: the booking, or 404. Rate-limited.                                                                       |
| POST   | `/v1/bookings/cancel` | `{ reference, phone }`: cancel if it's confirmed and starts at least 2 hours from now, else 409 `not_cancellable`. Rate-limited. |

Lookup and cancel are `POST` with a JSON body rather than `GET ?phone=`. That keeps the phone number out of URLs, which end up in server logs, proxies and browser history.

**Auth:**

| Method | Path              | Access  | Purpose                                                        |
| ------ | ----------------- | ------- | -------------------------------------------------------------- |
| POST   | `/v1/auth/login`  | public  | `{ email, password }` → sets the session cookie. Rate-limited. |
| POST   | `/v1/auth/logout` | session | Deletes the session and clears the cookie.                     |
| GET    | `/v1/auth/me`     | session | The current user, or 401.                                      |

**Admin-only** (a session with `role = admin`):

| Method | Path                              | Purpose                                                                                                                                                                                          |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/v1/admin/overview`              | Today's bookings and revenue, upcoming bookings, and the top service of the last 30 days.                                                                                                        |
| GET    | `/v1/admin/bookings`              | `?from&to&status&barberId&q&page`: the bookings table.                                                                                                                                           |
| GET    | `/v1/admin/bookings/:id`          | One booking.                                                                                                                                                                                     |
| PATCH  | `/v1/admin/bookings/:id`          | Edit customer details, notes, barber, service or time. Changing the service re-snapshots its price and duration.                                                                                 |
| POST   | `/v1/admin/bookings/:id/complete` | `confirmed` → `completed`.                                                                                                                                                                       |
| POST   | `/v1/admin/bookings/:id/cancel`   | `confirmed` → `cancelled`.                                                                                                                                                                       |
| GET    | `/v1/admin/services`              | All services, inactive ones included.                                                                                                                                                            |
| POST   | `/v1/admin/services`              | Create.                                                                                                                                                                                          |
| PATCH  | `/v1/admin/services/:id`          | Edit, including `isActive`.                                                                                                                                                                      |
| DELETE | `/v1/admin/services/:id`          | Delete; 409 `in_use` when bookings reference it.                                                                                                                                                 |
| GET    | `/v1/admin/barbers`               | All barbers with their hours, inactive ones included.                                                                                                                                            |
| POST   | `/v1/admin/barbers`               | Create (optionally with hours).                                                                                                                                                                  |
| PATCH  | `/v1/admin/barbers/:id`           | Edit, including `isActive`.                                                                                                                                                                      |
| DELETE | `/v1/admin/barbers/:id`           | Delete; 409 `in_use` when bookings reference it.                                                                                                                                                 |
| PUT    | `/v1/admin/barbers/:id/hours`     | Replace the whole week, in one transaction. 422 `outside_opening_hours` if any day falls outside opening hours; otherwise responds with any future bookings that now fall outside the new hours. |
| GET    | `/v1/admin/analytics`             | `?from&to`: bookings and revenue per day, bookings by service, bookings by barber.                                                                                                               |

**Revenue** counts `completed` bookings only. The overview also shows the value of today's still-`confirmed` bookings as "expected". Days are grouped in shop local time.

**Status transitions use their own routes** (`/complete`, `/cancel`) rather than `PATCH { status }`. Each one is a single clear action with its own rules and timestamp, and it's easy to authorise separately later, for example a barber may complete but not delete.

## Auth approach

- **The admin account** is created by a CLI script in the API app (`create-admin`), which asks for an email, name and password. There is no sign-up endpoint, so nobody can register themselves as admin.
- **Passwords** are hashed with **argon2id**, the current OWASP first choice. It's deliberately slow and memory-hard, so stolen hashes are expensive to crack. Login always answers "invalid email or password", whichever part was wrong. The library is confirmed in B4 (see open questions).
- **Sessions are server-side rows**, not JWTs.
  1. On login, the API generates 32 random bytes as the token.
  2. It stores `sha256(token)` in `sessions` with `expires_at = now + 30 days`.
  3. It sends the token in a cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`.
  4. On each request it hashes the cookie, looks the row up and checks the expiry.
  5. When less than half the lifetime is left, it pushes `expires_at` forward ("sliding" sessions). So an admin who uses the site regularly stays logged in, and an abandoned session dies.

  **Why not JWTs.** A server-side session can be revoked instantly: logout deletes the row, or delete all of a user's rows to "log out everywhere". A JWT stays valid until it expires, unless you add a blocklist, and that blocklist is a session table again. The cost of sessions is one indexed DB lookup per admin request, which is nothing at this scale.

  This follows the pattern of the Lucia auth guide, written by hand (around 100 lines) rather than pulled in as a library, because building it is the lesson.

- **`HttpOnly`** means JavaScript in the page can't read the cookie, so an XSS bug can't steal the session. **`SameSite=Lax`** means the browser doesn't attach it to cross-site POSTs, which is the main CSRF defence. On top of that, the API rejects state-changing requests whose `Origin` header isn't the frontend's.
- **Same origin through a proxy (proposed).** The frontend runs on Cloudflare (`*.workers.dev`) and the API on Railway, Render or Fly, which are different sites. Browsers increasingly block cookies set by a different site ("third-party cookies").
  - The plan: the browser only ever talks to the Next app, which forwards `/api/*` to the Fastify API, so the session cookie is first-party.
  - Admin pages rendered on the server forward the cookie when they call the API.
  - This also removes the need for CORS. Confirmed in B4/B6 (see open questions).
- **Rate limiting** (`@fastify/rate-limit`), per IP and in memory, which is fine for one API instance:
  - booking lookup and cancel: 10 per minute each, so nobody can guess the phone behind a known reference;
  - creating a booking: 10 per hour, so one script can't fill the calendar;
  - login (B4).

  **Behind the `/api` proxy (B6/B8)** every request reaches the API from the proxy's IP, so all guests would share one counter. The proxy must pass the guest's IP in `X-Forwarded-For`, and the API must trust that header from the proxy only (Fastify's `trustProxy`), since any client can send it.

## Approach

**Workspace:**

- `apps/barbershop` and `apps/barbershop-api` are new Nx projects, wired the same way as `apps/portfolio`: targets come from `package.json` scripts, and there are no Nx plugins.
- **`modules/barbershop-contracts`** (`@intromax/barbershop-contracts`) holds the zod schemas and inferred types.
  - It's a separate module rather than part of `modules/common`, because only these two apps use it, and the portfolio shouldn't carry it.
  - Like the other modules, it exports TypeScript source.
  - The Next app compiles it through `transpilePackages`.
  - The API runs from source with `tsx` in development and tests. For production it will be bundled (esbuild or similar), which inlines the module. The tool is chosen in B8, when the API first deploys.

**Database workflow:**

- **Local Postgres** runs in Docker (`compose.yaml` in the API app, a Postgres 17 image) on host port 5433, so it doesn't collide with a Postgres installed on the machine itself.
- **Drizzle** defines the tables in TypeScript.
- **`drizzle-kit generate`** writes SQL migration files, which are committed and reviewed like code.
- **What Drizzle's schema language can't express** goes in a hand-written custom migration in the same folder: `btree_gist` and the exclusion constraint. The checks on `during` are plain `CHECK`s, so they stay in `schema.ts`. `tstzrange` itself is a small custom column type (`src/db/tstzrange.ts`).
- **The driver** is `pg` (node-postgres), with a connection pool.

**Testing:**

- Pure logic (slot generation, reference codes, phone normalisation) gets unit tests.
- The API gets integration tests through Fastify's `inject()`, which makes HTTP requests without opening a port, against a real Postgres test database.
- The first test proves that two overlapping bookings are rejected **by the database**.
- **Database tests** run against `DATABASE_URL`, and each one runs in a transaction that is always rolled back. That's why they don't need a separate test database, and why they leave the dev data untouched. The local database must be up and migrated first.
- **Only the tests a change needs**, not exhaustive coverage.
- **Vitest** runs the tests. Its API is Jest-like and it runs TypeScript out of the box, and the same tool can test the Next app later.

**Environment variables** (called out per AGENTS.md; each one lands in `.env.example` in its stage):

| Name              | App            | Purpose                                                         | Introduced |
| ----------------- | -------------- | --------------------------------------------------------------- | ---------- |
| `DATABASE_URL`    | barbershop-api | Postgres connection string (Docker locally, Neon in production) | B2         |
| `PORT`            | barbershop-api | The port the API listens on. Optional, defaults to 3001         | B3a        |
| `FRONTEND_ORIGIN` | barbershop-api | The allowed `Origin` for state-changing requests                | B4         |
| `API_URL`         | barbershop     | Where the Next app forwards `/api/*`                            | B6         |

**New dependencies, flagged now and confirmed in their stage:**

- **B2 (approved):** `drizzle-orm`, `drizzle-kit`, `pg`, `@types/pg`, `tsx`, `vitest`. Docker Desktop (on WSL2) becomes a local prerequisite for running the database.
- **B3a (approved):** `fastify`, `zod` (in the pnpm catalog, shared by the contracts module and the API), `fastify-type-provider-zod`, `@date-fns/tz`.
- **B3b (approved):** `@fastify/rate-limit` (`~11.2.2`).
- **B4:** `@fastify/cookie` and an argon2 binding.
- **B6:** a chart library, for the admin analytics.
- **External services:** Neon and one API host. Docker is a new local tool.

## Stages

Barbershop track, each stage one PR, each explained step by step:

| Stage | Name                  | Delivers                                                                                                                                                                                       |
| ----- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1    | Spec                  | This document, plus the track in PROGRESS. No code.                                                                                                                                            |
| B2    | Data model            | The `apps/barbershop-api` skeleton (no HTTP yet), Docker Postgres, Drizzle schema and migrations including the exclusion constraint, the seed script, and tests that prove the DB constraints. |
| B3a   | Public reads          | The Fastify server, `modules/barbershop-contracts`, the error format, `/health`, shop, services, barbers, availability with slot generation, and integration tests.                            |
| B3b   | Guest bookings        | Create, look up and cancel a booking, error mapping (`23P01` → 409), rate limits, and integration tests.                                                                                       |
| B4    | Auth                  | `users`/`sessions` in use, argon2id, login/logout/me, the `create-admin` CLI, the admin guard, the Origin check, and tests.                                                                    |
| B5    | Admin API             | Admin bookings, services, barbers and hours, the overview and analytics, and tests.                                                                                                            |
| B6    | Frontend: public site | The `apps/barbershop` Next app: the landing page, booking flow, lookup and cancel, the `/api` proxy, and e2e smoke tests.                                                                      |
| B7    | Frontend: admin       | Admin login, overview, the bookings table, services and barbers CRUD with the hours editor, and analytics charts. Optional CSS animations.                                                     |
| B8    | Deploy                | Neon (production database and migrations), the API on the chosen host, the frontend Worker on Cloudflare, CI jobs for both apps, and secrets.                                                  |

## Acceptance criteria

**B1 (this stage):**

- [ ] The spec covers scope, roles, flows, the data model with its constraints explained, the API with access marked, auth, Later and open questions.
- [ ] `docs/PROGRESS.md` has the barbershop track with the B1-B8 breakdown.
- [ ] The open questions below are answered or explicitly deferred to a named stage.

**Whole project:**

- [ ] Two guests booking the same barber at overlapping times: exactly one succeeds, and the other gets 409. Proven by a DB-level test, not just a UI test.
- [ ] Slots respect the 15-minute grid, working hours, breaks, existing bookings and the full service duration, including on a DST-change day.
- [ ] Changing a service's price doesn't change existing bookings or past revenue.
- [ ] Every `/v1/admin/*` route returns 401 without a valid admin session, and a logged-out session can't be reused.
- [ ] Passwords and session tokens never appear in the database in plain form.
- [ ] A guest can look up and cancel only with the matching reference + phone.
- [ ] Lint, typecheck and the tests of each touched project pass.

## Later

Designed for, not built:

- **Barber logins.**
  - Add `'barber'` to `user_role`.
  - Add a nullable, unique `barbers.user_id` → `users.id`, which links a barber row to a login.
  - A barber sees and completes only their own bookings, enforced as a `WHERE barber_id = <mine>` in the API's authorisation layer.
  - Nothing existing changes shape.
- **Customer accounts.**
  - Add `'customer'` to `user_role`. New bookings made while logged in fill the existing `bookings.user_id`.
  - Guest bookings keep working with `user_id = NULL`. Past guest bookings could be claimed by verifying the phone or email.
  - "My bookings" is `WHERE user_id = <me>`.
- **The same session system** serves all three roles. Only the authorisation checks grow.
- **Smaller additions the schema can absorb:**
  - Barber time off (a `barber_time_off` table with a `tstzrange`, subtracted in slot generation).
  - Per-barber service lists (a `barber_services` join table).
  - A `no_show` status.
  - Reminders.
  - Admin-created walk-in bookings.
  - Password reset (needs email sending).
  - Editing shop settings and opening hours in the admin.
  - Removing customer personal data after a retention period.

## Open questions

1. **Opening hours vs barber hours: decided.** The API rejects barber hours outside opening hours when they're saved, and the seed's opening hours are widened to cover the barbers. See [`opening_hours`](#opening_hours) and [Seed data](#seed-data).

2. **The booking horizon and lead time: decided.** Bookable up to 60 days ahead and at least 1 hour before the start. Code constants in `src/schedule/slots.ts`; making them admin-editable `shop_settings` columns is a later change.
3. **The guest cancel cutoff: decided.** A guest can cancel online until 2 hours before the start (a constant, used in B3b).
4. **Phone normalisation: decided.** Keep a leading `+` and the digits, and require 7-15 digits; no country validation and no dependency. The schema is `phone` in the contracts module.
5. **Admin edits outside working hours.** When the admin moves a booking, should the API enforce working hours and the grid, or allow an override? Overlap is blocked by the DB either way. Proposed: enforce by default, with an explicit `force` flag.
6. **Hours changed under existing bookings.** When a barber's new hours leave future bookings outside them, proposed: save anyway and return those bookings so the admin can deal with them. Should it block instead?
7. **Deactivating a barber with future bookings.** Allow it, and list the bookings in the response? Or require them to be cancelled or moved first?
8. **The argon2 library** (B4): `@node-rs/argon2` (prebuilt binaries, no compiler needed on Windows) or `argon2` (node-gyp). Or Node's built-in `crypto.scrypt`, with no dependency but not the first-choice algorithm. Proposed: `@node-rs/argon2`.
9. **The `/api` proxy** (B4/B6): confirm that the frontend forwards `/api/*` to the API (first-party cookie, no CORS), rather than a custom domain with `api.` on the same site.
10. **The API host** (B8): Railway, Render or Fly.io. Proposed: decide in B8 after comparing the free and cheap tiers then. The API code stays host-agnostic: a plain Node process, `PORT` from env.
11. **The test runner: decided.** Vitest (see [Approach](#approach)).
