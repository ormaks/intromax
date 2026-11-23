import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { tstzrange } from "./tstzrange";

/*
 * The database schema. `drizzle-kit generate` turns changes to this file into
 * SQL migrations in ../../drizzle. The overlap rule on bookings
 * (`bookings_no_overlap`) can't be expressed here and lives in a hand-written
 * migration there. Drizzle doesn't know that constraint exists, so never use
 * `drizzle-kit push`: it would drop it. Always generate and migrate.
 *
 * Weekdays are 0-6 with 0 = Sunday, as in `Date#getDay()` and Postgres's
 * `extract(dow ...)`. Schedules are local wall-clock `time`, read in the
 * shop's timezone; bookings are `timestamptz` instants. Money is integer cents.
 */

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

const weekdayCheck = (name: string, column: AnyPgColumn) =>
  check(name, sql`${column} BETWEEN 0 AND 6`);

// ---------------------------------------------------------------- auth

export const userRole = pgEnum("user_role", ["admin"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    // argon2id PHC string: algorithm, cost settings, salt and hash in one.
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: userRole("role").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    // Case-insensitive: Admin@x.com and admin@x.com are one account.
    uniqueIndex("users_email_lower_unique").on(sql`lower(${t.email})`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 (hex) of the token in the cookie, never the token itself.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

// ---------------------------------------------------------------- shop

export const shopSettings = pgTable(
  "shop_settings",
  {
    // Always true: a second row would need a second `true` key, so the table
    // holds exactly one row.
    id: boolean("id").primaryKey().default(true),
    name: text("name").notNull(),
    // IANA name, e.g. America/New_York.
    timezone: text("timezone").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    address: text("address").notNull(),
  },
  (t) => [check("shop_settings_singleton", sql`${t.id}`)],
);

/** One row per open weekday; no row means closed. */
export const openingHours = pgTable(
  "opening_hours",
  {
    weekday: smallint("weekday").primaryKey(),
    opensAt: time("opens_at").notNull(),
    closesAt: time("closes_at").notNull(),
  },
  (t) => [
    weekdayCheck("opening_hours_weekday", t.weekday),
    check("opening_hours_order", sql`${t.opensAt} < ${t.closesAt}`),
  ],
);

// ---------------------------------------------------------------- catalogue

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes").notNull(),
    priceCents: integer("price_cents").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check(
      "services_name_length",
      sql`char_length(${t.name}) BETWEEN 1 AND 100`,
    ),
    check("services_duration", sql`${t.durationMinutes} BETWEEN 5 AND 480`),
    check("services_price", sql`${t.priceCents} >= 0`),
  ],
);

export const barbers = pgTable("barbers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  title: text("title"),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** One row per working weekday; no row means a day off. */
export const barberWorkingHours = pgTable(
  "barber_working_hours",
  {
    barberId: uuid("barber_id")
      .notNull()
      .references(() => barbers.id, { onDelete: "cascade" }),
    weekday: smallint("weekday").notNull(),
    startsAt: time("starts_at").notNull(),
    endsAt: time("ends_at").notNull(),
    breakStartsAt: time("break_starts_at"),
    breakEndsAt: time("break_ends_at"),
  },
  (t) => [
    primaryKey({ columns: [t.barberId, t.weekday] }),
    weekdayCheck("barber_working_hours_weekday", t.weekday),
    check("barber_working_hours_order", sql`${t.startsAt} < ${t.endsAt}`),
    check(
      "barber_working_hours_break_pair",
      sql`(${t.breakStartsAt} IS NULL) = (${t.breakEndsAt} IS NULL)`,
    ),
    check(
      "barber_working_hours_break_inside",
      sql`${t.breakStartsAt} IS NULL OR (
        ${t.startsAt} < ${t.breakStartsAt}
        AND ${t.breakStartsAt} < ${t.breakEndsAt}
        AND ${t.breakEndsAt} < ${t.endsAt}
      )`,
    ),
  ],
);

// ---------------------------------------------------------------- bookings

export const bookingStatus = pgEnum("booking_status", [
  "confirmed",
  "completed",
  "cancelled",
]);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // The short code the guest sees, e.g. K7M2-9QXA.
    reference: text("reference").notNull().unique(),
    barberId: uuid("barber_id")
      .notNull()
      .references(() => barbers.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    // Always null for guest bookings.
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    during: tstzrange("during").notNull(),
    status: bookingStatus("status").notNull().default("confirmed"),
    // Snapshots of the service at booking time.
    priceCents: integer("price_cents").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    customerName: text("customer_name").notNull(),
    // Normalised: a leading + and digits only.
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    notes: text("notes"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("bookings_price", sql`${t.priceCents} >= 0`),
    check("bookings_duration", sql`${t.durationMinutes} > 0`),
    check(
      "bookings_customer_name_length",
      sql`char_length(${t.customerName}) BETWEEN 1 AND 100`,
    ),
    // A finite, non-empty [start, end) range.
    check(
      "bookings_during_shape",
      sql`NOT isempty(${t.during})
        AND NOT lower_inf(${t.during}) AND NOT upper_inf(${t.during})
        AND lower_inc(${t.during}) AND NOT upper_inc(${t.during})`,
    ),
    // The range is exactly as long as the duration snapshot.
    check(
      "bookings_during_matches_duration",
      sql`upper(${t.during}) - lower(${t.during}) = make_interval(mins => ${t.durationMinutes})`,
    ),
    check(
      "bookings_cancelled_at_matches_status",
      sql`(${t.status} = 'cancelled') = (${t.cancelledAt} IS NOT NULL)`,
    ),
    check(
      "bookings_completed_at_matches_status",
      sql`(${t.status} = 'completed') = (${t.completedAt} IS NOT NULL)`,
    ),
  ],
);
