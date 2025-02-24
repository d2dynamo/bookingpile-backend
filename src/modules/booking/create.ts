import { eq, and, gt, ne, inArray } from 'drizzle-orm';
import db, { schema } from '../db';
import { UserError } from '../../util';
import type { BookingStatus } from './types';
import { checkTimeSlotAvailability } from './util';

export const createBooking = async (input: {
  roomId: number;
  start: number; // unix seconds
  //end: number; // unix seconds
}) => {
  const { roomId, start } = input;

  const normStart = new Date(start * 1000).setMinutes(0, 0, 0);
  const normEnd = new Date(start * 1000).setMinutes(59, 59, 0);

  const timeReserved = await db
    .select({
      bookingId: schema.booking.id,
      roomId: schema.roomBookings.roomId,
      status: schema.booking.status,
      createdAt: schema.booking.createdAt,
    })
    .from(schema.roomBookings)
    .innerJoin(
      schema.booking,
      eq(schema.roomBookings.bookingId, schema.booking.id)
    )
    .where(
      and(
        eq(schema.roomBookings.roomId, roomId),
        eq(schema.booking.start, normStart),
        eq(schema.booking.end, normEnd),
        ne(schema.booking.status, 'cancelled')
      )
    );

  const availability = await checkTimeSlotAvailability(timeReserved);

  console.log('availability', availability);

  if (availability !== true) {
    throw new UserError('Time is reserved by an ongoing booking.', 401);
  }

  const status = 'reserved' as BookingStatus;

  return await db.transaction(async (trx) => {
    const booking = await trx
      .insert(schema.booking)
      .values({
        status,
        start: normStart,
        end: normEnd,
      })
      .returning({ insertedId: schema.booking.id });

    const bookingId = booking[0].insertedId;

    if (!booking || !bookingId) {
      throw new Error('Failed to create a booking');
    }

    await trx.insert(schema.roomBookings).values({
      bookingId: bookingId,
      roomId: roomId,
    });

    return bookingId;
  });
};
