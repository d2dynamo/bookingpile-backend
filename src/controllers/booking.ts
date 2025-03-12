import type { Request, Response } from 'express';

import { updateBooking, getBooking } from '../modules/booking';
import { TimeSlot } from '../modules/timeSlot';
import { createBooking } from '../modules/booking';
import { isBookingStatus } from '../modules/booking';
import { UserError } from '../util';

export async function cCreateBooking(
  req: Request,
  res: Response,
  next: Function
) {
  try {
    const { roomId, start } = req.body;

    if (!roomId || isNaN(Number(roomId))) {
      res.locals = {
        error: true,
        code: 400,
        message: 'Invalid room ID',
      };
      next();
      return;
    }

    if (!start || isNaN(Number(start))) {
      res.locals = {
        error: true,
        code: 400,
        message: 'Invalid start date',
      };
      next();
      return;
    }

    const newTimeSlot = new TimeSlot(Number(roomId), Number(start));

    const bookingId = await createBooking(newTimeSlot);

    if (!bookingId) {
      throw new Error('Failed to create booking');
    }

    res.locals = {
      error: false,
      message: 'success',
      payload: {
        bookingId,
      },
    };
    next();
  } catch (err) {
    if (err instanceof UserError) {
      res.locals = {
        error: true,
        code: err.code || 400,
        message: err.message || 'unknown client error',
      };
      next();
      return;
    }

    res.locals = {
      error: true,
      code: 500,
      message: 'internal server error',
    };
    next();
  }
}

export async function cUpdateBooking(
  req: Request,
  res: Response,
  next: Function
) {
  try {
    const { bookingId, status, reservationName } = req.body;

    if (!bookingId || isNaN(Number(bookingId))) {
      res.locals = {
        error: true,
        code: 400,
        message: 'Invalid booking ID',
      };
      next();
      return;
    }

    if (status && (typeof status !== 'string' || !isBookingStatus(status))) {
      res.locals = {
        error: true,
        code: 400,
        message: 'Invalid booking status',
      };
      next();
      return;
    }

    if (reservationName && typeof reservationName !== 'string') {
      res.locals = {
        error: true,
        code: 400,
        message: 'Invalid reservation name',
      };
      next();
      return;
    }

    await updateBooking({
      bookingId: Number(bookingId),
      status,
      reservationName,
    });

    res.locals = {
      error: false,
      message: 'success',
    };
    next();
  } catch (err) {
    if (err instanceof UserError) {
      res.locals = {
        error: true,
        code: err.code || 400,
        message: err.message || 'unknown client error',
      };
      next();
      return;
    }

    res.locals = {
      error: true,
      code: 500,
      message: 'internal server error',
    };
    next();
  }
}

export async function cGetBooking(req: Request, res: Response, next: Function) {
  try {
    const { id } = req.params;
    const bId = Number(id);

    if (!bId || isNaN(bId)) {
      res.locals = {
        error: true,
        code: 400,
        message: 'Invalid booking ID',
      };
      next();
      return;
    }

    const timeSlot = await getBooking(bId);

    res.locals = {
      error: false,
      message: 'success',
      payload: timeSlot.toObject(),
    };
    next();
  } catch (err) {
    if (err instanceof UserError) {
      res.locals = {
        error: true,
        code: err.code || 400,
        message: err.message || 'unknown client error',
      };
      next();
      return;
    }

    console.error(err);
    res.locals = {
      error: true,
      code: 500,
      message: 'internal server error',
    };
    next();
  }
}
