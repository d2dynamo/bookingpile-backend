import { cCreateBooking, cUpdateStatus } from './controllers/booking';
import { cListAvailableTimes, cListRooms } from './controllers/room';
import { UserError } from './util';

async function cHello(req: Request) {
  return new Response('Hello, World!', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

const server = Bun.serve({
  async fetch(request) {
    try {
      const url = new URL(request.url);

      switch (url.pathname) {
        case '/hello':
          return await cHello(request);
        case '/rooms/list':
          return await cListRooms(request);
        case '/rooms/available':
          return await cListAvailableTimes(request);
        case '/booking/create':
          return await cCreateBooking(request);
        case '/booking/status':
          return await cUpdateStatus(request);
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (e: any) {
      if (e instanceof UserError) {
        return new Response(e.message, { status: e.code || 400 });
      }
      if (
        e instanceof SyntaxError &&
        e.message === 'Unexpected end of JSON input'
      ) {
        return new Response('malformed body in request', { status: 400 });
      }
      console.error(e);
      return new Response('internal server error', { status: 500 });
    }
  },
});

console.log(`Listening on port ${server.port}`);
