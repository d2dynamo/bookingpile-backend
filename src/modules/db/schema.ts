import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  integer,
  text,
  primaryKey,
} from 'drizzle-orm/sqlite-core';

/** unixepoch() gives seconds not milis. */

export const rooms = sqliteTable('rooms', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  capacity: integer('capacity').notNull(),
});

export const booking = sqliteTable('booking', {
  id: integer('id').primaryKey(),
  status: text('status')
    .notNull()
    .$type<'reserved' | 'cancelled' | 'confirmed'>(),
  reservationName: text('reservation_name'),
  start: integer('start').notNull(),
  end: integer('end') // not strictly needed now but here for future development of timeslot logic.
    .notNull(),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const roomBookings = sqliteTable(
  'room_bookings',
  {
    roomId: integer('room_id')
      .notNull()
      .references(() => rooms.id),
    bookingId: integer('booking_id')
      .notNull()
      .references(() => booking.id),
  },
  (t) => [primaryKey({ columns: [t.roomId, t.bookingId] })]
);
