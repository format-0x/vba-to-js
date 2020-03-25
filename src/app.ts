import express, { Response, Request, NextFunction } from 'express';
import createError, { HttpError } from 'http-errors';
import logger from 'morgan';
import path from 'path';
import http from 'http';
import { promises } from 'fs';
import prettier from 'prettier';
import compile from './compiler';
import io from 'socket.io';
import 'reflect-metadata';
import { AppRouter } from './routes';
import './controllers';

const app = express();
const server = http.createServer(app);
const sock = io(server);

sock.on('connection', (socket) => {
  console.log('socket connection established');

  socket.on('compile', (code: string) => {
    try {
      const compiled = compile(code);
      socket.emit('message', prettier.format(compiled, { parser: 'babel' }));
    } catch (error) {
      socket.emit('compileError', error.message);
    }
  });

  socket.on('preload', () => {
    promises.readFile(path.join(__dirname, 'code.vb'), { encoding: 'utf8' })
      .then(socket.emit.bind(socket, 'code'))
      .catch(console.error);
  });
});
sock.on('disconnect', () => console.log('disconnected'));

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

  console.error(err);

  res.sendStatus(err.status || 500);
});

server.listen(3000, () => console.log('server connection established'));

export default server;
