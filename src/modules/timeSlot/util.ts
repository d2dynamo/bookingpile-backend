import type { BookingStatus } from '../booking/types';
import TimeSlot from './timeSlot';

const bookingHourInRange = (epoch: number): boolean => {
  const date = new Date(epoch * 1000);
  const hour = date.getHours();
  return hour >= 7 && hour <= 17;
};

async function buildTimeSlots(
  bookings: {
    roomId: number;
    startEpoch: number;
    bookingId?: number;
    status?: BookingStatus;
    reservationName?: string;
  }[]
): Promise<Array<TimeSlot>> {
  const slots: TimeSlot[] = [];

  for (const booking of bookings) {
    if (!booking.roomId || !booking.startEpoch) {
      console.log(
        'Invalid booking details, missing roomId and start epoch',
        booking.bookingId
      );
      continue;
    }

    if (!bookingHourInRange(booking.startEpoch)) {
      console.log(
        'Invalid booking time, should be within 7am and 5pm',
        booking.bookingId
      );
    }

    const slot = new TimeSlot(
      booking.roomId,
      booking.startEpoch,
      booking.bookingId,
      booking.status,
      booking.reservationName
    );
    slots.push(slot);
  }

  return slots;
}

export default buildTimeSlots;
