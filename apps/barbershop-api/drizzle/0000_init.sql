CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin');--> statement-breakpoint
CREATE TABLE "barber_working_hours" (
	"barber_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"starts_at" time NOT NULL,
	"ends_at" time NOT NULL,
	"break_starts_at" time,
	"break_ends_at" time,
	CONSTRAINT "barber_working_hours_barber_id_weekday_pk" PRIMARY KEY("barber_id","weekday"),
	CONSTRAINT "barber_working_hours_weekday" CHECK ("barber_working_hours"."weekday" BETWEEN 0 AND 6),
	CONSTRAINT "barber_working_hours_order" CHECK ("barber_working_hours"."starts_at" < "barber_working_hours"."ends_at"),
	CONSTRAINT "barber_working_hours_break_pair" CHECK (("barber_working_hours"."break_starts_at" IS NULL) = ("barber_working_hours"."break_ends_at" IS NULL)),
	CONSTRAINT "barber_working_hours_break_inside" CHECK ("barber_working_hours"."break_starts_at" IS NULL OR (
        "barber_working_hours"."starts_at" < "barber_working_hours"."break_starts_at"
        AND "barber_working_hours"."break_starts_at" < "barber_working_hours"."break_ends_at"
        AND "barber_working_hours"."break_ends_at" < "barber_working_hours"."ends_at"
      ))
);
--> statement-breakpoint
CREATE TABLE "barbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"bio" text,
	"photo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"barber_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"user_id" uuid,
	"during" "tstzrange" NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"price_cents" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text,
	"notes" text,
	"cancelled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_reference_unique" UNIQUE("reference"),
	CONSTRAINT "bookings_price" CHECK ("bookings"."price_cents" >= 0),
	CONSTRAINT "bookings_duration" CHECK ("bookings"."duration_minutes" > 0),
	CONSTRAINT "bookings_customer_name_length" CHECK (char_length("bookings"."customer_name") BETWEEN 1 AND 100),
	CONSTRAINT "bookings_during_shape" CHECK (NOT isempty("bookings"."during")
        AND NOT lower_inf("bookings"."during") AND NOT upper_inf("bookings"."during")
        AND lower_inc("bookings"."during") AND NOT upper_inc("bookings"."during")),
	CONSTRAINT "bookings_during_matches_duration" CHECK (upper("bookings"."during") - lower("bookings"."during") = make_interval(mins => "bookings"."duration_minutes")),
	CONSTRAINT "bookings_cancelled_at_matches_status" CHECK (("bookings"."status" = 'cancelled') = ("bookings"."cancelled_at" IS NOT NULL)),
	CONSTRAINT "bookings_completed_at_matches_status" CHECK (("bookings"."status" = 'completed') = ("bookings"."completed_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "opening_hours" (
	"weekday" smallint PRIMARY KEY NOT NULL,
	"opens_at" time NOT NULL,
	"closes_at" time NOT NULL,
	CONSTRAINT "opening_hours_weekday" CHECK ("opening_hours"."weekday" BETWEEN 0 AND 6),
	CONSTRAINT "opening_hours_order" CHECK ("opening_hours"."opens_at" < "opening_hours"."closes_at")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_name_length" CHECK (char_length("services"."name") BETWEEN 1 AND 100),
	CONSTRAINT "services_duration" CHECK ("services"."duration_minutes" BETWEEN 5 AND 480),
	CONSTRAINT "services_price" CHECK ("services"."price_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_settings" (
	"id" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"timezone" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"address" text NOT NULL,
	CONSTRAINT "shop_settings_singleton" CHECK ("shop_settings"."id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "barber_working_hours" ADD CONSTRAINT "barber_working_hours_barber_id_barbers_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."barbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_barber_id_barbers_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."barbers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_unique" ON "users" USING btree (lower("email"));