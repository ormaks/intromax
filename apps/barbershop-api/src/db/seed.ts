import { count, eq } from "drizzle-orm";
import { loadEnv, requireEnv } from "../env";
import {
  type OpeningDay,
  type WorkingDay,
  weekdaysOutsideOpeningHours,
} from "../schedule/openingHours";
import { createDb, type Db } from "./client";
import {
  barbers,
  barberWorkingHours,
  openingHours,
  services,
  shopSettings,
} from "./schema";

/*
 * Fills the database with the shop's settings, its opening hours and a demo
 * catalogue. Safe to run again:
 * - the shop row and the opening hours are always rewritten, since nothing
 *   references them;
 * - the demo services and barbers go in only while both tables are empty, so
 *   rows the admin created, and the bookings pointing at them, are never
 *   touched.
 *
 * Run with `pnpm nx db:seed barbershop-api`.
 */

const SHOP = {
  name: "The Royal Intromax Cut",
  timezone: "America/New_York",
  phone: "+1 (555) 234-5678",
  email: "hello@theroyalcut.com",
  address: "742 Barber Lane, Suite 3\nBrooklyn, NY 11201",
};

// 0 = Sunday.
const MON_TO_SAT = [1, 2, 3, 4, 5, 6];

const OPENING_DAYS: OpeningDay[] = [
  { weekday: 0, opensAt: "08:00", closesAt: "17:00" },
  { weekday: 1, opensAt: "09:00", closesAt: "19:00" },
  ...MON_TO_SAT.slice(1).map((weekday) => ({
    weekday,
    opensAt: "08:00",
    closesAt: "19:00",
  })),
];

const SERVICES = [
  { name: "Classic Haircut", priceCents: 2500, durationMinutes: 30 },
  { name: "Skin Fade", priceCents: 3000, durationMinutes: 45 },
  { name: "Beard Trim", priceCents: 1500, durationMinutes: 15 },
  { name: "Haircut + Beard Combo", priceCents: 4000, durationMinutes: 60 },
  { name: "Kids Haircut", priceCents: 2000, durationMinutes: 30 },
  { name: "Hot Towel Shave", priceCents: 2500, durationMinutes: 30 },
  { name: "Hair Coloring", priceCents: 5000, durationMinutes: 60 },
  { name: "VIP Grooming Package", priceCents: 7000, durationMinutes: 90 },
].map((service, index) => ({ ...service, sortOrder: index }));

/** The same hours and break on each of the given weekdays. */
function week(
  weekdays: number[],
  [startsAt, endsAt]: [string, string],
  [breakStartsAt, breakEndsAt]: [string, string],
) {
  return weekdays.map((weekday) => ({
    weekday,
    startsAt,
    endsAt,
    breakStartsAt,
    breakEndsAt,
  }));
}

const BARBERS = [
  {
    name: "James Carter",
    title: "Senior Barber",
    hours: week([1, 2, 3, 4, 5], ["09:00", "18:00"], ["13:00", "14:00"]),
  },
  {
    name: "Marcus Johnson",
    title: "Senior Barber",
    hours: week(MON_TO_SAT, ["10:00", "19:00"], ["14:00", "15:00"]),
  },
  {
    name: "David Williams",
    title: "Senior Barber",
    hours: week([2, 3, 4, 5, 6, 0], ["08:00", "17:00"], ["12:00", "13:00"]),
  },
];

function assertHoursFitOpening(
  schedules: { name: string; hours: WorkingDay[] }[],
) {
  for (const { name, hours } of schedules) {
    const outside = weekdaysOutsideOpeningHours(hours, OPENING_DAYS);
    if (outside.length > 0) {
      throw new Error(
        `${name} works outside opening hours on weekday(s) ${outside.join(", ")}`,
      );
    }
  }
}

/** Every barber already in the database, with their stored hours. */
async function storedSchedules(tx: Pick<Db, "select">) {
  const rows = await tx
    .select({
      name: barbers.name,
      weekday: barberWorkingHours.weekday,
      startsAt: barberWorkingHours.startsAt,
      endsAt: barberWorkingHours.endsAt,
    })
    .from(barberWorkingHours)
    .innerJoin(barbers, eq(barbers.id, barberWorkingHours.barberId));

  const byName = new Map<string, WorkingDay[]>();
  for (const { name, ...day } of rows) {
    byName.set(name, [...(byName.get(name) ?? []), day]);
  }
  return [...byName].map(([name, hours]) => ({ name, hours }));
}

async function seed() {
  assertHoursFitOpening(BARBERS);

  loadEnv();
  const { db, pool } = createDb(requireEnv("DATABASE_URL"));
  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(shopSettings)
        .values(SHOP)
        .onConflictDoUpdate({ target: shopSettings.id, set: SHOP });

      await tx.delete(openingHours);
      await tx.insert(openingHours).values(OPENING_DAYS);
      // Hours already in the database must still fit; throwing here rolls
      // the whole seed back.
      assertHoursFitOpening(await storedSchedules(tx));
      console.log("Shop settings and opening hours written.");

      const [serviceRows] = await tx.select({ n: count() }).from(services);
      const [barberRows] = await tx.select({ n: count() }).from(barbers);
      if (serviceRows?.n || barberRows?.n) {
        console.log(
          "Services or barbers already exist; demo catalogue skipped.",
        );
        return;
      }

      await tx.insert(services).values(SERVICES);
      for (const [index, { hours, ...barber }] of BARBERS.entries()) {
        const [row] = await tx
          .insert(barbers)
          .values({ ...barber, sortOrder: index })
          .returning({ id: barbers.id });
        if (!row) throw new Error(`Inserting ${barber.name} returned nothing`);
        await tx
          .insert(barberWorkingHours)
          .values(hours.map((day) => ({ ...day, barberId: row.id })));
      }
      console.log(
        `Demo catalogue added: ${SERVICES.length} services, ${BARBERS.length} barbers.`,
      );
    });
  } finally {
    await pool.end();
  }
}

await seed();
