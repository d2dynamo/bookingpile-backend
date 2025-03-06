import { eq } from 'drizzle-orm';
import db, { schema } from '../db';
import { UserError } from '../../util';
import type { BookingStatus } from './types';
import { sortTimeSlotAvailability } from './util';

// booking is reserved when user presses next after selecting time slot. Booking is confirmed when user presses 'book' button after entering name
export const updateBooking = async (input: {
  bookingId: number;
  reservationName?: string;
  status?: BookingStatus;
}) => {
  const { bookingId } = input;

  return await db.transaction(async (trx) => {
    const bookings = await trx
      .select({
        bookingId: schema.booking.id,
        roomId: schema.roomBookings.roomId,
        status: schema.booking.status,
        start: schema.booking.start,
        updatedAt: schema.booking.updatedAt,
      })
      .from(schema.booking)
      .innerJoin(
        schema.roomBookings,
        eq(schema.roomBookings.bookingId, schema.booking.id)
      )
      .where(eq(schema.booking.id, bookingId));

    // not needed with consistency checking middleware
    // const existingValidBooking = await sortTimeSlotAvailability(bookings);

    // if (
    //   existingValidBooking !== true &&
    //   existingValidBooking.bookingId !== bookingId
    // ) {
    //   throw new UserError('Your booking reservation has expired.', 401);
    // }

    const set: any = {};
    if (input.reservationName) {
      set.reservationName = input.reservationName;
    }

    if (input.status) {
      set.status = input.status;
    }

    const booking = await trx
      .update(schema.booking)
      .set(set)
      .where(eq(schema.booking.id, bookingId))
      .returning({ id: schema.booking.id });

    if (!booking || !booking.length) {
      throw new UserError('Booking not found', 404);
    }

    return true;
  });
};
