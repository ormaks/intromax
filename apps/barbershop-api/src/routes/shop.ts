import { shop } from "@intromax/barbershop-contracts";
import { asc } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../db/client";
import { openingHours, shopSettings } from "../db/schema";
import { toHHMM } from "../schedule/clock";

/** GET /v1/shop: the shop's details and its weekly opening hours. */
export const shopRoutes: FastifyPluginAsyncZod<{ db: Db }> = async (
  app,
  { db },
) => {
  app.get("/shop", { schema: { response: { 200: shop } } }, async () => {
    const [settings] = await db.select().from(shopSettings);
    // The seed always writes this row; without it the shop isn't set up.
    if (!settings) throw new Error("shop_settings is empty; run db:seed");

    const days = await db
      .select()
      .from(openingHours)
      .orderBy(asc(openingHours.weekday));

    return {
      ...settings,
      openingHours: days.map((day) => ({
        weekday: day.weekday,
        opensAt: toHHMM(day.opensAt),
        closesAt: toHHMM(day.closesAt),
      })),
    };
  });
};
