import { eq, and, or, gte, lte, inArray } from 'drizzle-orm';

import db, { schema } from '../db';
import { buildTimeSlots } from '../timeSlot';
import type { ValidHour } from '../timeSlot/types';
import { cleanupOldBookings } from '../booking/util';

export const listRoomsBasic = async () => {
  const rooms = await db
    .select({
      id: schema.rooms.id,
      name: schema.rooms.name,
      capacity: schema.rooms.capacity,
    })
    .from(schema.rooms)
    .all();

  return rooms;
};

/** Calculates the days between two dates.
 *
 * @param from - Unix timestamp in seconds
 * @param to - Unix timestamp in seconds
 * @returns Object containing start day, end day, and days between
 */
const daysRange = (from: number, to: number) => {
  const fromDate = new Date(from * 1000);
  const toDate = new Date(to * 1000);

  const startDay = fromDate.getDate();
  const endDay = toDate.getDate();

  // Calculate days between, accounting for month/year boundaries
  const startTime = new Date(fromDate);
  startTime.setHours(0, 0, 0, 0);

  const endTime = new Date(toDate);
  endTime.setHours(0, 0, 0, 0);

  // Calculate difference in days
  const diffTime = Math.abs(endTime.getTime() - startTime.getTime());
  const daysBetween = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return { startDay, endDay, daysBetween };
};

type AvailableTimes = {
  // key: roomId
  [key: number]: {
    // key: dayofmonth, value: hours available for the day
    [key: number]: ValidHour[];
  };
};

export const listAvailable = async (input: {
  roomIds: number[];
  frameFrom: number; // unix seconds
  frameTo: number; // unix seconds
}): Promise<AvailableTimes> => {
  if (!input.roomIds || !input.roomIds.length) {
    throw new Error('No room IDs provided');
  }

  const roomIds = input.roomIds;
  const frameFrom = input.frameFrom;
  const frameTo = input.frameTo;

  console.log('input', roomIds, frameFrom, frameTo);

  const reservedTimes = await db
    .select({
      bookingId: schema.roomBookings.bookingId,
      roomId: schema.roomBookings.roomId,
      startEpoch: schema.booking.start,
      endEpoch: schema.booking.end,
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
        inArray(schema.roomBookings.roomId, roomIds),
        or(
          and(
            gte(schema.booking.start, frameFrom),
            lte(schema.booking.start, frameTo)
          ),
          and(
            gte(schema.booking.end, frameFrom),
            lte(schema.booking.end, frameTo)
          ),
          and(
            lte(schema.booking.start, frameFrom),
            gte(schema.booking.end, frameTo)
          )
        ),
        or(
          eq(schema.booking.status, 'reserved'),
          eq(schema.booking.status, 'confirmed')
        )
      )
    );

  cleanupOldBookings(reservedTimes);

  const workingHours: ValidHour[] = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

  const {
    startDay: frameFromDay,
    endDay: frameToDay,
    daysBetween,
  } = daysRange(frameFrom, frameTo);

  console.log('daysRange', frameFromDay, frameToDay, daysBetween);

  const availableTimes: {
    [key: number]: {
      [key: string]: ValidHour[];
    };
  } = {};

  if (reservedTimes.length === 0) {
    //no reserved times then just fill in all working hours
    for (const roomId of roomIds) {
      if (!availableTimes[roomId]) {
        availableTimes[roomId] = {};
      }

      const fromDate = new Date(frameFrom * 1000);

      for (let i = 0; i < daysBetween; i++) {
        const currentDate = new Date(fromDate);
        currentDate.setDate(fromDate.getDate() + i);
        const currentDay = currentDate.getDate();
        const currentMonth = currentDate.getMonth() + 1;
        const dateKey = `${currentMonth}/${currentDay}`;

        availableTimes[roomId][dateKey] = [...workingHours];
      }
    }
    console.log('availableTimes', availableTimes);
    return availableTimes;
  }

  const bookedSlots = await buildTimeSlots(reservedTimes);
  console.log('bookedSlots', bookedSlots);

  for (const roomId of roomIds) {
    for (let i = 0; i < daysBetween; i++) {
      const availableHours = [...workingHours];

      const currentDate = new Date(frameFrom * 1000);
      currentDate.setDate(frameFromDay + i);
      const day = currentDate.getDate();
      const month = currentDate.getMonth() + 1;
      const dateKey = `${month}/${day}`;

      for (const slot of bookedSlots) {
        if (slot.roomId === roomId && slot.getDayOfMonth() === day) {
          const hourIndex = availableHours.indexOf(slot.getHour() as ValidHour);
          if (hourIndex !== -1) {
            availableHours.splice(hourIndex, 1);
          }
        }
      }

      if (availableHours.length > 0) {
        if (!availableTimes[roomId]) {
          availableTimes[roomId] = {};
        }
        availableTimes[roomId][dateKey] = availableHours;
      }
    }
  }

  console.log('availableTimes', availableTimes);

  return availableTimes;
};
