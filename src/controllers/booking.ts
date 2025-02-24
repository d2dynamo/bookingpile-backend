import { createBooking } from '../modules/booking';
import type { BookingStatus } from '../modules/booking/types';
import { updateBooking, getBooking } from '../modules/booking';

export async function cCreateBooking(req: Request) {
  try {
    const { roomId, start } = await req.json();

    if (!roomId || isNaN(Number(roomId))) {
      return new Response('Invalid room ID', { status: 400 });
    }

    if (!start || isNaN(Number(start))) {
      return new Response('Invalid from date', { status: 400 });
    }

    // if (!end || isNaN(end)) {
    //   return new Response('Invalid to date', { status: 400 });
    // }

    const bookingId = await createBooking({
      roomId: Number(roomId),
      start: Number(start),
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
  return ['reserved', 'cancelled', 'confirmed'].includes(status);
};

export async function cUpdateBooking(req: Request) {
  try {
    const { bookingId, status, reservationName } = await req.json();

    if (!bookingId || isNaN(Number(bookingId))) {
      return new Response('Invalid booking ID', { status: 400 });
    }

    if (status && (typeof status !== 'string' || !isBookingStatus(status))) {
      return new Response('Invalid status', { status: 400 });
    }

    if (reservationName && typeof reservationName !== 'string') {
      return new Response('Invalid reservation name', { status: 400 });
    }

    await updateBooking({
      bookingId: Number(bookingId),
      status,
      reservationName,
    });

    return new Response('success', {
      status: 200,
    });
  } catch (e) {
    throw e;
  }
}

export async function cGetBooking(req: Request) {
  try {
    const { id } = req.params;
    const bId = Number(id);

    if (!bId || isNaN(bId)) {
      return new Response('Invalid booking ID', { status: 400 });
    }

    const booking = await getBooking(bId);

    return new Response(JSON.stringify(booking), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    throw e;
  }
}
