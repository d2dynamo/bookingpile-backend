import type { Request, Response } from 'express';

import { listAvailableRoomTimes, listRoomsBasic } from '../modules/room';
import { unixSec, UserError } from '../util';

export async function cListRooms(req: Request, res: Response, next: Function) {
  try {
    const rooms = await listRoomsBasic();

    res.locals = {
      error: false,
      message: 'success',
      payload: rooms,
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

/**
 * Parses the roomIds query parameter into an array of numbers
 * @param qRoomIds Query parameter value (e.g., '1,2,3' or '1')
 * @returns Array of room IDs as numbers, or empty array if invalid input
 */
const parseRoomIdsQuery = (qRoomIds: any): number[] => {
  // Handle undefined or null case
  if (!qRoomIds) {
    return [];
  }

  if (Array.isArray(qRoomIds)) {
    return qRoomIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
  }

  const roomIdsStr = String(qRoomIds);

  if (roomIdsStr.trim() === '') {
    return [];
  }

  return roomIdsStr
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));
};

export async function cListAvailableTimes(
  req: Request,
  res: Response,
  next: Function
) {
  try {
    const { roomIds: qRoomIds, from, to } = req.query;

    const roomIds = parseRoomIdsQuery(qRoomIds);

    if (!roomIds.length) {
      roomIds.push(...(await listRoomsBasic()).map((room) => room.id));
    }

    const now = new Date();

    let frameFrom = unixSec(new Date().setHours(7, 0, 0, 0));
    let frameTo = unixSec(
      new Date(now.setDate(now.getDate() + 2)).setHours(17, 0, 0, 0)
    );

    if (from) {
      if (isNaN(Number(from))) {
        throw new UserError('Invalid from date', 400);
      }
      frameFrom = unixSec(Number(from));
    }

    if (to) {
      if (isNaN(Number(to))) {
        throw new UserError('Invalid to date', 400);
      }
      frameTo = unixSec(Number(to));
    }

    const availableTimes = await listAvailableRoomTimes({
      roomIds,
      frameFrom,
      frameTo,
    });

    res.locals = {
      error: false,
      message: 'success',
      payload: availableTimes,
    };
    next();
  } catch (err) {
    if (err instanceof UserError) {
      res.locals = {
        error: true,
        status: err.code || 400,
        message: err.message || 'unknown client error',
      };
      next();
      return;
    }

    res.locals = {
      error: true,
      status: 500,
      message: 'internal server error',
    };
    next();
  }
}
