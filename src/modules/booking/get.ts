import { eq } from 'drizzle-orm';
import db, { schema } from '../db';
import { UserError } from '../../util';

export const getBooking = async (bookingId: number) => {
  const data = await db
    .select({
      id: schema.booking.id,
      roomId: schema.roomBookings.roomId,
      start: schema.booking.start,
      end: schema.booking.end,
      status: schema.booking.status,
      reservationName: schema.booking.reservationName,
    })
    .from(schema.booking)
    .innerJoin(
      schema.roomBookings,
      eq(schema.roomBookings.bookingId, schema.booking.id)
    )
    .where(eq(schema.booking.id, bookingId));

  if (!data || !data.length) {
    throw new UserError('Booking not found', 404);
  }

  return data[0];
};
