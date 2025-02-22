import { eq, and, or } from 'drizzle-orm';
import db, { schema } from '../db';
import { UserError } from '../../util';
import type { BookingStatus } from './types';

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
      id: schema.roomBookings.roomId,
    })
    .from(schema.roomBookings)
    .innerJoin(
      schema.booking,
      eq(schema.roomBookings.bookingId, schema.booking.id)
    )
    .innerJoin(
      schema.bookingStatus,
      eq(schema.booking.statusId, schema.bookingStatus.id)
    )
    .where(
      and(
        eq(schema.roomBookings.roomId, roomId),
        eq(schema.booking.start, normStart),
        eq(schema.booking.end, normEnd),
        or(
          eq(schema.bookingStatus.type, 'reserved'),
          eq(schema.bookingStatus.type, 'confirmed')
        )
      )
    );

  if (timeReserved.length > 0) {
    throw new UserError('Time is reserved by an ongoing booking.', 401);
  }

  const status = 'processing' as BookingStatus;

  return await db.transaction(async (trx) => {
    const bookingStatus = await trx
      .insert(schema.bookingStatus)
      .values({ type: status })
      .returning({ insertedId: schema.bookingStatus.id });

    const insertedStatusId = bookingStatus[0].insertedId;

    if (!insertedStatusId) {
      throw new Error('Failed to create a booking status');
    }

    const booking = await trx
      .insert(schema.booking)
      .values({
        statusId: insertedStatusId,
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
