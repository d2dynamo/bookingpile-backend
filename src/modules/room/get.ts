import { eq } from 'drizzle-orm';

import db, { schema } from '../db';
import type { Room } from './types';

export const getRoom = async (roomId: number): Promise<Room> => {
  const result = await db
    .select({
      id: schema.rooms.id,
      name: schema.rooms.name,
      capacity: schema.rooms.capacity,
    })
    .from(schema.rooms)
    .limit(1)
    .where(eq(schema.rooms.id, roomId));

  if (!result.length) {
    throw new Error('Room not found');
  }

  return result[0];
};
