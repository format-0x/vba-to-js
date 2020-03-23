import prettier from 'prettier';
import { Request, Response } from 'express';
import { controller, post } from './decorators';
import compile from '../compiler';
import { constants } from 'http2';

@controller('/compile')
export class Compiler {
  @post('/vba')
  compile(request: Request, response: Response) {
    const { body } = request;

    try {
      const compiled = compile(body);

      response.send(prettier.format(compiled));
    } catch (error) {
      response.status(constants.HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
