import { eq, and, ne } from 'drizzle-orm';
import db, { schema } from '../db';
import { UserError } from '../../util';
import type { BookingStatus } from './types';
import { sortTimeSlotAvailability } from './util';
import { TimeSlot } from '../timeSlot';

interface InputBookable {
  roomId: number;
  /**
   * Unix timestamp in seconds for the start of the timeslot
   */
  startSec: number;
  reservationName?: string;
}
export const createBooking = async (input: InputBookable) => {
  const timeSlot = new TimeSlot(input.roomId, input.startSec);

  if (input.reservationName) {
    timeSlot.reservationName = input.reservationName;
  }

  const timeReserved = await db
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
        eq(schema.roomBookings.roomId, timeSlot.roomId),
        eq(schema.booking.start, timeSlot.startSec),
        eq(schema.booking.end, timeSlot.endSec),
        ne(schema.booking.status, 'cancelled')
      )
    );

  const availability = await sortTimeSlotAvailability(timeReserved);

  if (availability !== true) {
    throw new UserError('Time is reserved by an ongoing booking.', 401);
  }

  const status = 'reserved' as BookingStatus;

  return await db.transaction(async (trx) => {
    const bInsert = {
      status,
      start: timeSlot.startSec,
      end: timeSlot.endSec,
      reservationName: timeSlot.reservationName,
    };

    const booking = await trx
      .insert(schema.booking)
      .values(bInsert)
      .returning({ insertedId: schema.booking.id });

    const bookingId = booking[0].insertedId;

    if (!booking || !bookingId) {
      throw new Error('Failed to create a booking');
    }

    await trx.insert(schema.roomBookings).values({
      roomId: timeSlot.roomId,
      bookingId,
    });

    return bookingId;
  });
};
