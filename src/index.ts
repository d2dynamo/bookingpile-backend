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

function setCorsHeaders(res: Response) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
}

const server = Bun.serve({
  async fetch(request) {
    const url = new URL(request.url);

    let response: Response;

    try {
      switch (url.pathname) {
        case '/hello':
          response = await cHello(request);
          break;
        case '/rooms/list':
          response = await cListRooms(request);
          break;
        case '/rooms/available':
          response = await cListAvailableTimes(request);
          break;
        case '/booking/create':
          response = await cCreateBooking(request);
          break;
        case '/booking/status':
          response = await cUpdateStatus(request);
          break;
        default:
          response = new Response('Not Found', { status: 404 });
      }
    } catch (e: any) {
      if (e instanceof UserError) {
        response = new Response(e.message, { status: e.code || 400 });
      } else if (
        e instanceof SyntaxError &&
        e.message === 'Unexpected end of JSON input'
      ) {
        response = new Response('malformed body in request', { status: 400 });
      } else {
        console.error(e);
        response = new Response('internal server error', { status: 500 });
      }
    }

    setCorsHeaders(response);
    return response;
  },
});

console.log(`Listening on port ${server.port}`);
