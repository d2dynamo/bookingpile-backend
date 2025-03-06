export const unixSec = (input: Date | number): number => {
  if (input instanceof Date) {
    return Math.floor(input.getTime() / 1000);
  }

  if (typeof input !== 'number') {
    throw new Error('Input must be a Date object or a number');
  }

  if (input > 10000000000) {
    return Math.floor(input / 1000);
  }

  return input;
};

// returns last day of the given dates month.
export const lastDay = (date: Date): number => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return d.getDate();
};
