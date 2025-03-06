import type { Request, Response } from 'express';
import { cleanupOldReservationsAll } from '../modules/booking/util';

const CheckInterval = 10 * 60 * 1000; // 10 minutes
const lastCheck = Date.now();

export async function timeSlotConsistency(
  req: Request,
  res: Response,
  next: Function
) {
  if (Date.now() - lastCheck < CheckInterval) {
    next();
    return;
  }
  await cleanupOldReservationsAll();
  next();
}
