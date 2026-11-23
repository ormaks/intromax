-- Hand-written: Drizzle's schema language has no exclusion constraints.
--
-- No two live bookings for the same barber may overlap in time. Works like a
-- UNIQUE constraint with "overlaps" (&&) in place of "equals" for `during`.
-- Postgres checks it on every insert and update through a GiST index and
-- fails with SQLSTATE 23P01 on a conflict. Cancelled bookings are left out,
-- so cancelling frees the slot.
--
-- GiST indexes understand ranges natively but not `=` on a uuid; btree_gist
-- adds that, so both columns fit in one constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap" EXCLUDE USING gist (
  "barber_id" WITH =,
  "during" WITH &&
) WHERE ("status" <> 'cancelled');
