export type BookingStatus =
  | 'reserved' // room selected
  | 'cancelled' // reservation expired or user cancelled
  | 'confirmed'; // booked

export type RoomBookingTime = {
  bookingId: number;
  roomId: number;
  status: BookingStatus;
  createdAt: number;
};
