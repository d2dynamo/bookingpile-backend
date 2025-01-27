import TimeSlot from './timeSlot';

const bookingHourInRange = (epoch: number): boolean => {
  const date = new Date(epoch);
  const hour = date.getHours();
  return hour >= 7 && hour <= 17;
};

async function buildTimeSlots(
  bookings: { bookingId: number; roomId: number; startEpoch: number }[]
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

    const slot = new TimeSlot(booking.roomId, booking.startEpoch);
    slots.push(slot);
  }

  return slots;
}

export default buildTimeSlots;
