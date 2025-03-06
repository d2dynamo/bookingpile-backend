import type { BookingStatus } from '../booking/types';
import { isBookingStatus } from '../booking/util';
import type { DayOfMonth, Month, TimeSlotData, ValidHour } from './types';

class TimeSlot {
  readonly roomId: number;
  private _startDate: Date;
  private _endDate: Date;
  private _bookingId: number | undefined;
  private _status: BookingStatus | undefined;
  public reservationName: string | undefined;

  /**
   * Currently the constructor will only take startEpoch and force the endEpoch to conform to 1hr slot architecture based on hour of startEpoch.
   * This can ofcourse be changed in future.
   * @param {number} roomId
   * @param {number} [startEpoch=Date.now()] - Unix timestamp in seconds or milliseconds
   * @param {number} [bookingId] - Booking ID
   * @param {BookingStatus} [status] - Booking status
   * @param {string} [reservationName] - Reservation name
   */
  constructor(
    roomId: number,
    startEpoch: number = Date.now(),
    bookingId?: number,
    status?: BookingStatus,
    reservationName?: string
  ) {
    this.roomId = roomId;

    const timestamp = startEpoch > 9999999999 ? startEpoch : startEpoch * 1000;

    this._startDate = new Date(timestamp);
    this._startDate.setMinutes(0, 0, 0);

    this._endDate = new Date(timestamp);
    this._endDate.setMinutes(59, 59, 0);

    if (status && !isBookingStatus(status)) {
      throw new Error(`Invalid booking status: ${status}`);
    }

    this._bookingId = bookingId;

    this._status = status;

    this.reservationName = reservationName;
  }

  /**
   * Get start in seconds
   */
  get startSec(): number {
    return Math.floor(this._startDate.getTime() / 1000);
  }

  /**
   * Get start in milliseconds
   */
  get startMs(): number {
    return this._startDate.getTime();
  }

  /**
   * Get end in seconds
   */
  get endSec(): number {
    return Math.floor(this._endDate.getTime() / 1000);
  }

  /**
   * Get end in milliseconds
   */
  get endMs(): number {
    return this._endDate.getTime();
  }

  get isBooked(): boolean {
    return this._bookingId !== undefined;
  }

  get bookingId(): number {
    if (this._bookingId === undefined) {
      throw new Error(
        `Booking ID not set for room: ${this.roomId}| at: ${
          this.getYear
        }/${this.getMonthDayKey()}/${this.getHour()}:00`
      );
    }

    return this._bookingId;
  }

  set bookingId(id: number) {
    if (this._bookingId !== undefined) {
      throw new Error(`May not reset bookingId ${this._bookingId} to ${id}`);
    }

    if (isNaN(Number(id))) {
      throw new Error(`Invalid booking ID: ${id}`);
    }

    this._bookingId = Number(id);
  }

  get status(): BookingStatus {
    if (this._status === undefined) {
      throw new Error(
        `Booking status not set for room: ${this.roomId}| at: ${
          this.getYear
        }/${this.getMonthDayKey()}/${this.getHour()}:00`
      );
    }
    return this._status;
  }

  set status(s: BookingStatus) {
    if (!isBookingStatus(s)) {
      throw new Error(`Invalid booking status: ${s}`);
    }

    this._status = s;
  }

  toObject(): TimeSlotData {
    return {
      roomId: this.roomId,
      start: this.startSec,
      end: this.endSec,
      bookingId: this.bookingId,
      status: this.status,
      reservationName: this.reservationName,
    };
  }

  toJsonString(): string {
    return JSON.stringify(this.toObject());
  }

  valueOf(): number {
    return Math.floor(this._startDate.getTime() / 1000);
  }

  getHour(): ValidHour {
    return this._startDate.getHours() as ValidHour;
  }

  getDayOfMonth(): DayOfMonth {
    return this._startDate.getDate() as DayOfMonth;
  }

  getMonth(): Month {
    return (this._startDate.getMonth() + 1) as Month;
  }

  getMonthDayKey(): string {
    return `${this.getMonth()}/${this.getDayOfMonth()}`;
  }

  getYear(): number {
    return this._startDate.getFullYear();
  }

  setHour(hour: ValidHour): void {
    this._startDate.setHours(hour, 0, 0, 0);
    this._endDate.setHours(hour, 59, 59, 0);
  }

  setDay(day: DayOfMonth): void {
    const month = this._startDate.getMonth();
    const year = this._startDate.getFullYear();
    const maxDay = new Date(year, month + 1, 0).getDate();

    if (day < 1 || day > maxDay) {
      day = day < 1 ? 1 : (maxDay as DayOfMonth);
    }

    this._startDate.setDate(day);
    this._endDate.setDate(day);
  }

  addDays(days: number): void {
    this._startDate.setDate(this._startDate.getDate() + days);
    this._endDate.setDate(this._endDate.getDate() + days);
  }

  setMonth(month: Month): void {
    const currentDay = this._startDate.getDate();

    this._startDate.setMonth(month - 1);
    this._endDate.setMonth(month - 1);

    const maxDay = new Date(this._startDate.getFullYear(), month, 0).getDate();
    if (currentDay > maxDay) {
      this._startDate.setDate(maxDay);
      this._endDate.setDate(maxDay);
    }
  }
}

export default TimeSlot;
