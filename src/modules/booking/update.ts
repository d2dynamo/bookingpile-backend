import { eq } from 'drizzle-orm';
import db, { schema } from '../db';
import { UserError } from '../../util';
import type { BookingStatus } from './types';

// booking is reserved when user presses next after selecting time slot. Booking is confirmed when user presses 'book' button after entering name
export const changeStatus = async (input: {
  bookingId: number;
  status: BookingStatus;
}) => {
  const { bookingId } = input;

  const booking = await db
    .select({
      statusId: schema.booking.statusId,
    })
    .from(schema.booking)
    .limit(1)
    .where(eq(schema.booking.id, bookingId));

  if (!booking || !booking.length) {
    throw new UserError('Booking not found', 404);
  }

  const statusId = booking[0].statusId;

  if (!statusId) {
    throw new UserError('Booking status not found', 404);
  }

  await db
    .update(schema.bookingStatus)
    .set({ type: input.status })
    .where(eq(schema.bookingStatus.id, statusId));
};
