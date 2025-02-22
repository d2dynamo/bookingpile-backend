import { eq } from 'drizzle-orm';
import db, { schema } from '../db';
import { UserError } from '../../util';
import type { BookingStatus } from './types';

// booking is reserved when user presses next after selecting time slot. Booking is confirmed when user presses 'book' button after entering name
export const updateBooking = async (input: {
  bookingId: number;
  reservationName?: string;
  status?: BookingStatus;
}) => {
  const { bookingId } = input;

  return await db.transaction(async (trx) => {
    const set: any = {};
    if (input.reservationName) {
      set.reservationName = input.reservationName;
    }

    const booking = await trx
      .update(schema.booking)
      .set(set)
      .where(eq(schema.booking.id, bookingId))
      .returning({ id: schema.booking.id, statusId: schema.booking.statusId });

    if (!booking || !booking.length) {
      throw new UserError('Booking not found', 404);
    }

    if (input.status) {
      const statusId = booking[0].statusId;

      if (!statusId) {
        throw new UserError('Booking status not found', 404);
      }

      await trx
        .update(schema.bookingStatus)
        .set({ type: input.status })
        .where(eq(schema.bookingStatus.id, statusId));
    }

    return true;
  });
};
