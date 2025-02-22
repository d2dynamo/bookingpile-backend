import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  integer,
  text,
  primaryKey,
} from 'drizzle-orm/sqlite-core';

export const rooms = sqliteTable('rooms', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  capacity: integer('capacity').notNull(),
});

export const bookingStatus = sqliteTable('booking_status', {
  id: integer('id').primaryKey(),
  type: text('type')
    .notNull()
    .$type<'processing' | 'reserved' | 'cancelled' | 'confirmed'>(),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const booking = sqliteTable('booking', {
  id: integer('id').primaryKey(),
  statusId: integer('status_id')
    .notNull()
    .references(() => bookingStatus.id),
  reservationName: text('reservation_name'),
  start: integer('start')
    .notNull()
    .default(sql`(unixepoch())`),
  end: integer('end') // not strictly needed now but here for future development of timeslot logic.
    .notNull()
    .default(sql`(unixepoch())`),
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
