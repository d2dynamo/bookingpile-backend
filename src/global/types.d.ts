declare global {
  interface Request {
    params: {
      [key: string]: string;
    };
  }
}

export {};
