export interface Room {
  id: number;
  name: string;
  capacity: number;
}

export type RoomGet = Room;

export type RoomList = Room[];

export interface RoomsAvailableTimes {
  // key: roomId. Value array of unix seconds timestamps denoted the start of the available time.
  // Only works as long as timeslots are only 1 hour long.
  [key: number]: Array<number>;
}

export interface ListAvailableRoomsInput {
  roomIds: number[];
  frameFrom: number;
  frameTo: number;
}

export type ListAvailableRoomsOutput = AvailableTimes;
