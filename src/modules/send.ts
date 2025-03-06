import type { Request, Response } from 'express';

export async function send(req: Request, res: Response) {
  if (!res.locals.error && !res.locals.payload && !res.locals.message) {
    res.status(404).json({
      error: true,
      message: 'Not found',
      payload: {},
    });
    return;
  }

  // <----Default response---->
  const resData: any = {
    error: res.locals.error || false,
    message: res.locals.message || '',
    payload: res.locals.payload || {},
  };
  let resCode = res.locals.code || res.locals.status || 200;
  if (typeof resCode !== 'number') resCode = 200;
  // <------------------------>
  res.status(resCode).json(resData);
}

export default send;
