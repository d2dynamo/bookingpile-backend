import { changeStatus, createBooking } from '../modules/booking';
import type { BookingStatus } from '../modules/booking/types';

export async function cCreateBooking(req: Request) {
  try {
    const { roomId, reservationName, start } = await req.json();

    if (!roomId || isNaN(roomId)) {
      return new Response('Invalid room ID', { status: 400 });
    }

    if (!reservationName || typeof reservationName !== 'string') {
      return new Response('Invalid reservation name', { status: 400 });
    }

    if (!start || isNaN(start)) {
      return new Response('Invalid from date', { status: 400 });
    }

    // if (!end || isNaN(end)) {
    //   return new Response('Invalid to date', { status: 400 });
    // }

    const bookingId = await createBooking({
      roomId,
      reservationName,
      start,
      //end,
    });

    return new Response(JSON.stringify({ bookingId }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    throw e;
  }
}

const isBookingStatus = (status: string): status is BookingStatus => {
  return ['processing', 'reserved', 'cancelled', 'confirmed'].includes(status);
};

export async function cUpdateStatus(req: Request) {
  try {
    const { bookingId, status } = await req.json();

    if (!bookingId || isNaN(bookingId)) {
      return new Response('Invalid booking ID', { status: 400 });
    }

    if (!status || typeof status !== 'string' || !isBookingStatus(status)) {
      return new Response('Invalid status', { status: 400 });
    }

    await changeStatus({ bookingId, status });

    return new Response('success', {
      status: 200,
    });
  } catch (e) {
    throw e;
  }
}
