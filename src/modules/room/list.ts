import { eq, and, or, gte, lte, inArray } from 'drizzle-orm';

import db, { schema } from '../db';
import { buildTimeSlots } from '../timeSlot';
import { cleanupOldBookings } from '../booking/util';
import { unixSec } from '../../util/time';
import type {
  ListAvailableRoomsInput,
  ListAvailableRoomsOutput,
  RoomList,
  RoomsAvailableTimes,
} from './types';

export const listRoomsBasic = async (): Promise<RoomList> => {
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

export const listAvailableRoomTimes = async (
  input: ListAvailableRoomsInput
): Promise<ListAvailableRoomsOutput> => {
  if (!input.roomIds || !input.roomIds.length) {
    throw new Error('No room IDs provided');
  }

  const roomIds = input.roomIds;
  const frameFrom = input.frameFrom;
  const frameTo = input.frameTo;

  let reservedTimes = await db
    .select({
      bookingId: schema.roomBookings.bookingId,
      roomId: schema.roomBookings.roomId,
      startEpoch: schema.booking.start,
      endEpoch: schema.booking.end,
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

  reservedTimes = await cleanupOldBookings(reservedTimes);

  const availableTimes: RoomsAvailableTimes = {};

  if (reservedTimes.length === 0) {
    //no reserved times then just fill in all working hours
    for (const roomId of roomIds) {
      if (!availableTimes[roomId]) {
        availableTimes[roomId] = [];
      }

      const fromDate = new Date(frameFrom * 1000);
      const toDate = new Date(new Date(frameTo * 1000).setHours(18));

      const currentDate = new Date(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate(),
        7,
        0,
        0,
        0
      );
      let lg = 0;

      while (currentDate.getTime() < toDate.getTime()) {
        if (lg > 10000) {
          console.error('loop guard. breaking.');
          break;
        }
        lg++;

        availableTimes[roomId].push(unixSec(currentDate));

        const hour = currentDate.getHours();

        if (hour < 17) {
          currentDate.setHours(hour + 1);
        } else {
          currentDate.setDate(currentDate.getDate() + 1);
          currentDate.setHours(7);
        }
      }
    }
    return availableTimes;
  }

  const bookedSlots = await buildTimeSlots(reservedTimes);

  for (const roomId of roomIds) {
    const fromDate = new Date(frameFrom * 1000);
    const toDate = new Date(new Date(frameTo * 1000).setHours(18));

    const currentDate = new Date(
      fromDate.getFullYear(),
      fromDate.getMonth(),
      fromDate.getDate(),
      7,
      0,
      0,
      0
    );

    while (currentDate.getTime() < toDate.getTime()) {
      const hour = currentDate.getHours();
      const currentTime = unixSec(currentDate.getTime());

      let isAvailable = true;
      for (const slot of bookedSlots) {
        if (slot.roomId === roomId && slot.startSec === currentTime) {
          isAvailable = false;
          break;
        }
      }

      if (isAvailable) {
        if (!availableTimes[roomId]) {
          availableTimes[roomId] = [];
        }

        availableTimes[roomId].push(currentTime);
      }

      if (hour < 17) {
        currentDate.setHours(hour + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(7);
      }
    }
  }

  return availableTimes;
};
