import {
  cCreateBooking,
  cGetBooking,
  cUpdateBooking,
} from './controllers/booking';
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

function matchPath(
  pattern: string,
  path: string
): { [key: string]: string } | null {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: { [key: string]: string } = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      const paramName = patternParts[i].slice(1);
      params[paramName] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return params;
}

type Handler = (req: Request) => Promise<Response>;

const server = Bun.serve({
  async fetch(request) {
    const url = new URL(request.url);
    let response: Response = new Response('Not Found', { status: 404 });

    try {
      const routes = [
        { pattern: '/hello', handler: cHello },
        { pattern: '/rooms/list', handler: cListRooms },
        { pattern: '/rooms/available', handler: cListAvailableTimes },
        { pattern: '/booking/get/:id', handler: cGetBooking },
        { pattern: '/booking/create', handler: cCreateBooking },
        { pattern: '/booking/update', handler: cUpdateBooking },
      ];

      let h: Handler | null = null;
      for (const route of routes) {
        const params = matchPath(route.pattern, url.pathname);
        if (params !== null) {
          (request as any).params = params;
          h = route.handler;
          break;
        }
      }

      if (!h) {
        setCorsHeaders(response);
        return response;
      }

      response = await h(request);
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
    } finally {
      setCorsHeaders(response);
      return response;
    }
  },
});

console.log(`Listening on port ${server.port}`);
