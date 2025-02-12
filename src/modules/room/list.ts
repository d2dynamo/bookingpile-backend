import { eq, and, or, gte, lte, inArray } from 'drizzle-orm';

import db, { schema } from '../db';
import { buildTimeSlots } from '../timeSlot';
import type { ValidHour } from '../timeSlot/types';

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

type AvailableTimes = {
  // key: roomId
  [key: number]: {
    // key: dayofmonth, value: hours available for the day
    [key: number]: ValidHour[];
  };
};

export const listAvailable = async (input: {
  roomIds: number[];
  frameFrom: number;
  frameTo: number;
}): Promise<AvailableTimes> => {
  if (!input.roomIds || !input.roomIds.length) {
    throw new Error('No room IDs provided');
  }

  const roomIds = input.roomIds;
  const frameFrom = input.frameFrom * 1000;
  const frameTo = input.frameTo * 1000;

  const reservedTimes = await db
    .select({
      bookingId: schema.roomBookings.bookingId,
      roomId: schema.roomBookings.roomId,
      startEpoch: schema.booking.start,
      endEpoch: schema.booking.end,
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
          eq(schema.bookingStatus.type, 'reserved'),
          eq(schema.bookingStatus.type, 'confirmed')
        )
      )
    );

  const workingHours: ValidHour[] = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

  const frameFromDay = new Date(frameFrom).getDate();
  const frameToDay = new Date(frameTo).getDate();

  const availableTimes: {
    [key: number]: {
      [key: number]: ValidHour[];
    };
  } = {};

  if (reservedTimes.length === 0) {
    //no reserved times then just fill in all working hours
    for (const roomId of roomIds) {
      for (let day = frameFromDay; day <= frameToDay; day++) {
        if (!availableTimes[roomId]) {
          availableTimes[roomId] = {};
        }
        availableTimes[roomId][day] = [...workingHours];
      }
    }
    return availableTimes;
  }

  const bookedSlots = await buildTimeSlots(reservedTimes);

  for (const roomId of roomIds) {
    for (let day = frameFromDay; day <= frameToDay; day++) {
      const availableHours = [...workingHours];

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
        availableTimes[roomId][day] = availableHours;
      }
    }
  }

  return availableTimes;
};
