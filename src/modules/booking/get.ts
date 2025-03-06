import { eq } from 'drizzle-orm';
import db, { schema } from '../db';
import { UserError } from '../../util';
import { TimeSlot } from '../timeSlot';
import { checkTimeSlotAvailability } from './util';

export const getBooking = async (bookingId: number): Promise<TimeSlot> => {
  const result = await db
    .select({
      id: schema.booking.id,
      roomId: schema.roomBookings.roomId,
      startSec: schema.booking.start,
      end: schema.booking.end,
      status: schema.booking.status,
      reservationName: schema.booking.reservationName,
      updatedAt: schema.booking.updatedAt,
    })
    .from(schema.booking)
    .limit(1)
    .innerJoin(
      schema.roomBookings,
      eq(schema.roomBookings.bookingId, schema.booking.id)
    )
    .where(eq(schema.booking.id, bookingId));

  console.log(result);

  if (!result || !result.length) {
    throw new UserError('Booking not found', 404);
  }

  // checkTimeSlotAvailability returns FALSE if given booking is NOT EXPIRED
  await checkTimeSlotAvailability(result[0]);

  return new TimeSlot(
    result[0].roomId,
    result[0].startSec,
    result[0].id ?? undefined,
    result[0].status ?? undefined,
    result[0].reservationName ?? undefined
  );
};
