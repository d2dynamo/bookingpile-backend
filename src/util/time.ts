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
