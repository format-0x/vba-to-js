import { Request, Response } from 'express';
import { controller, post } from './decorators';
import compile from '../compiler';

@controller('/compile')
export class Compiler {
  @post('/vba')
  compile(request: Request, response: Response) {
    const { body: { code } } = request;
    const compiled = compile(code);

    response.send(compiled);
  }
}
