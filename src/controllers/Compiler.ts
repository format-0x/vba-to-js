import prettier from 'prettier';
import { Request, Response } from 'express';
import { controller, post } from './decorators';
import compile from '../compiler';
import { socket } from '../app';

@controller('/compile')
export class Compiler {
  @post('/vba')
  compile(request: Request, response: Response) {
    const { body } = request;
    const compiled = compile(body);

    socket.emit('message', prettier.format(compiled));
    response.sendStatus(200);
  }
}
