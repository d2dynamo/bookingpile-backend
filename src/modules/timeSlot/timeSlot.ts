import { unixSec } from '../../util';
import type { DayOfMonth, Month, ValidHour } from './types';

class TimeSlot {
  readonly roomId: number;
  startEpoch: number; // unix seconds
  endEpoch: number; // unix seconds

  // Currently the constructor will only take startEpoch and force the endEpoch to conform to 1hr slot architecture based on hour of startEpoch.
  // This can ofcourse be changed in future.
  constructor(
    roomId: number,
    startEpoch: number = new Date().getTime()
    //endEpoch: number = new Date().getTime()
  ) {
    this.roomId = roomId;
    this.startEpoch = unixSec(new Date(startEpoch * 1000).setMinutes(0, 0, 0));
    this.endEpoch = unixSec(new Date(startEpoch * 1000).setMinutes(59, 59, 0));
  }

  getDayOfMonth(): DayOfMonth {
    const date = new Date(this.startEpoch * 1000);
    return date.getDate() as DayOfMonth;
  }

  getHour(): ValidHour {
    const date = new Date(this.startEpoch * 1000);
    return date.getHours() as ValidHour;
  }

  getMonth(): Month {
    const date = new Date(this.startEpoch * 1000);
    return (date.getMonth() + 1) as Month;
  }

  setDay(day: DayOfMonth): void {
    const date = new Date(this.startEpoch * 1000);
    const month = date.getMonth();
    const year = date.getFullYear();
    const maxDay = new Date(year, month + 1, 0).getDate();

    if (day < 1 || day > maxDay) {
      day = day < 1 ? 1 : (maxDay as DayOfMonth);
    }

    date.setDate(day);
    this.startEpoch = unixSec(new Date(date).setMinutes(0, 0, 0));
    this.endEpoch = unixSec(new Date(date).setMinutes(59, 59, 0));
  }

  setHour(hour: ValidHour): void {
    const date = new Date(this.startEpoch * 1000);
    date.setHours(hour, 0, 0, 0);
    this.startEpoch = unixSec(new Date(date).setMinutes(0, 0, 0));
    this.endEpoch = unixSec(new Date(date).setMinutes(59, 59, 0));
  }

  setMonth(month: Month): void {
    const startDate = new Date(this.startEpoch * 1000);
    const endDate = new Date(this.endEpoch * 1000);

    startDate.setMonth(month - 1);
    endDate.setMonth(month - 1);

    const maxDay = new Date(startDate.getFullYear(), month, 0).getDate();
    if (startDate.getDate() > maxDay) {
      startDate.setDate(maxDay);
    }
    if (endDate.getDate() > maxDay) {
      endDate.setDate(maxDay);
    }

    this.startEpoch = unixSec(new Date(startDate).setMinutes(0, 0, 0));
    this.endEpoch = unixSec(new Date(endDate).setMinutes(59, 59, 0));
  }
}

export default TimeSlot;
