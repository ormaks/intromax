import type { Booking, BookingStatus } from "@intromax/barbershop-contracts";
import type { TimeRange } from "../db/tstzrange";
import { formatMinutes } from "../schedule/clock";
import { shopClock } from "../schedule/slots";

/** A booking with the names it's shown with. */
export type BookingRecord = {
  reference: string;
  status: BookingStatus;
  during: TimeRange;
  priceCents: number;
  durationMinutes: number;
  customerName: string;
  service: { id: string; name: string };
  barber: { id: string; name: string };
};

/** A booking as the guest sees it, with its start on the shop's clock. */
export function bookingView(record: BookingRecord, timezone: string): Booking {
  const local = shopClock(record.during.start, timezone);
  return {
    reference: record.reference,
    status: record.status,
    start: record.during.start.toISOString(),
    end: record.during.end.toISOString(),
    date: local.date,
    label: formatMinutes(local.minutes),
    service: record.service,
    barber: record.barber,
    priceCents: record.priceCents,
    durationMinutes: record.durationMinutes,
    customerName: record.customerName,
  };
}
