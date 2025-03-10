import { inArray, and, eq, lte } from 'drizzle-orm';
import db, { schema } from '../db';
import type { RoomBookingTime } from './types';
import { unixSec } from '../../util';

/** cancels all old reservations
 *
 * @param bookings array of room bookings for the same time slot.
 * @returns A booking that is confirmed or reserved, else true if all bookings are expire/cancelled.
 */
export async function checkTimeSlotAvailability<T extends RoomBookingTime>(
  bookings: T[]
): Promise<T | true> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).getSeconds();

  let confirmed: false | T = false;
  let reservedRecent: false | T = false;
  const oldBookingIds: number[] = [];

  for (let i = 0; i < bookings.length; i++) {
    const book = bookings[i];

    if (book.status === 'confirmed') {
      confirmed = book;
      break;
    }

    if (book.createdAt > fifteenMinutesAgo) {
      reservedRecent = book;
      break;
    }

    oldBookingIds.push(book.bookingId);
  }

  await db
    .update(schema.booking)
    .set({ status: 'cancelled' })
    .where(inArray(schema.booking.id, oldBookingIds));

  return confirmed || reservedRecent || true;
}

export async function cleanupOldBookings<T extends RoomBookingTime>(
  bookings: T[]
): Promise<T[]> {
  const fifteenMinutesAgo = unixSec(Date.now()) - 15 * 60;

  const oldBookingIds = bookings
    .filter((book) => book.createdAt < fifteenMinutesAgo)
    .map((book) => book.bookingId);

  await db
    .update(schema.booking)
    .set({ status: 'cancelled' })
    .where(inArray(schema.booking.id, oldBookingIds));

  return bookings.filter((b) => !oldBookingIds.includes(b.bookingId));
}
