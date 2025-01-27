import { listAvailable, listRoomsBasic } from '../modules/room';

export async function cListRooms(req: Request) {
  try {
    const rooms = await listRoomsBasic();

    return new Response(JSON.stringify(rooms), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    throw e;
  }
}

export async function cListAvailableTimes(req: Request) {
  try {
    const url = new URL(req.url);
    const queryParams = url.searchParams;

    const from = queryParams.get('from')
      ? Number(queryParams.get('from'))
      : undefined;
    const to = queryParams.get('to')
      ? Number(queryParams.get('to'))
      : undefined;
    const qRoomIds = queryParams.get('roomIds')
      ? queryParams.get('roomIds')?.split(',').map(Number) ?? []
      : [];

    const roomIds = [];
    if (!qRoomIds || !Array.isArray(qRoomIds) || !qRoomIds.length) {
      roomIds.push(...(await listRoomsBasic()).map((room) => room.id));
    } else {
      roomIds.push(...qRoomIds);
    }
    const now = new Date();

    let frameFrom = Math.floor(new Date().setHours(7, 0, 0, 0) / 1000);
    let frameTo = Math.floor(
      new Date(now.setDate(now.getDate() + 2)).setHours(17, 0, 0, 0) / 1000
    );

    if (from) {
      if (isNaN(from) || from.toString().length !== 10) {
        return new Response('Invalid from date', { status: 400 });
      }
      frameFrom = from;
    }

    if (to) {
      if (isNaN(to) || to.toString().length !== 10) {
        return new Response('Invalid to date', { status: 400 });
      }
      frameTo = to;
    }

    const availableTimes = await listAvailable({ roomIds, frameFrom, frameTo });

    return new Response(JSON.stringify(availableTimes), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    throw e;
  }
}
