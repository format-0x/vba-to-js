import express, { Response, Request, NextFunction } from 'express';
import createError, { HttpError } from 'http-errors';
import logger from 'morgan';
import path from 'path';
import http from 'http';
import io from 'socket.io';
import 'reflect-metadata';
import { AppRouter } from './routes';
import './controllers';

const app = express();
const server = http.createServer(app);
export const socket = io(server);

socket.on('connection', () => console.log('connection established'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(AppRouter.getInstance());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  res.locals.message = err.message;
  res.locals.error = err;

  res.sendStatus(err.status || 500);
});

server.listen(3000);

export default server;
