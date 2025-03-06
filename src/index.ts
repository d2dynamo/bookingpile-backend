import express from 'express';

import cors from './middleware/cors';
import send from './modules/send';

const app = express();

app.set('x-powered-by', false);

app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import booking from './router/booking';
import room from './router/room';

app.use('/booking', [booking, send]);
app.use('/rooms', [room, send]);

app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Not found',
    payload: {},
  });
});

const normPort = (val?: string) => {
  if (!val) {
    return 3000;
  }

  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return 3000;
};

app.listen(normPort(process.env.PORT));
console.log(`Server started on port ${normPort(process.env.PORT)}`);
