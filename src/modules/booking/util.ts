import { inArray, and, eq, ne, lte } from 'drizzle-orm';
import db, { schema } from '../db';
import type { BookingStatus, RoomBookingTime } from './types';
import { unixSec } from '../../util';

/** cancels all old reservations
 *
 * @param bookings array of room bookings for the same time and room.
 * @returns A booking that is confirmed or reserved, else true if all bookings are expired/cancelled.
 */
export async function sortTimeSlotAvailability<T extends RoomBookingTime>(
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

    if (book.updatedAt > fifteenMinutesAgo) {
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
    .filter((book) => book.updatedAt < fifteenMinutesAgo)
    .map((book) => book.bookingId);

  await db
    .update(schema.booking)
    .set({ status: 'cancelled' })
    .where(inArray(schema.booking.id, oldBookingIds));

  return bookings.filter((b) => !oldBookingIds.includes(b.bookingId));
}

/** This function would typically be written in a microservice that runs consistency checks in looping intervals.
 * A language i would use would be golang.
 *
 * Finds and cancels ALL 'reserved' bookings that arer older than 15 minutes.
 */
export async function cleanupOldReservationsAll() {
  const fifteenMinutesAgo = unixSec(Date.now()) - 15 * 60;

  await db
    .update(schema.booking)
    .set({ status: 'cancelled' })
    .where(
      and(
        eq(schema.booking.status, 'reserved'),
        lte(schema.booking.updatedAt, fifteenMinutesAgo)
      )
    );

  return;
}

/**
 *
 * @param opts options
 * @param opts.bookingId booking id to check.
 * @param opts.roomId room id to check, required with startSec.
 * @param opts.startSec start time in seconds, required with roomId.
 * @returns true - time slot is available, false - time slot is reserved/booked or given booking is still valid.
 */
export async function checkTimeSlotAvailability<
  T extends RoomBookingTime & { start: number }
>(opts: { booking?: T; roomId?: number; startSec?: number }): Promise<boolean> {
  const { booking, roomId, startSec } = opts;

  let rId;
  let sSec;

  if (booking) {
    rId = booking.roomId;
    sSec = booking.start;
  }

  if (roomId && startSec) {
    rId = roomId;
    sSec = startSec;
  }

  if (!rId || !sSec) {
    throw new Error('roomId and startSec are required');
  }

  const timesReserved = await db
    .select({
      bookingId: schema.booking.id,
      roomId: schema.roomBookings.roomId,
      status: schema.booking.status,
      updatedAt: schema.booking.updatedAt,
    })
    .from(schema.roomBookings)
    .innerJoin(
      schema.booking,
      eq(schema.roomBookings.bookingId, schema.booking.id)
    )
    .where(
      and(
        eq(schema.roomBookings.roomId, rId),
        eq(schema.booking.start, sSec),
        ne(schema.booking.status, 'cancelled')
      )
    );

  const availability = await sortTimeSlotAvailability(timesReserved);

  if (booking) {
    return !(
      typeof availability !== 'boolean' &&
      availability.bookingId === booking.bookingId
    );
  }

  return availability === true;
}

export const isBookingStatus = (status: string): status is BookingStatus => {
  return ['reserved', 'cancelled', 'confirmed'].includes(status);
};
