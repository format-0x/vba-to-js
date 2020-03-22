import { RequestHandler } from 'express';
import {MetadataKeys} from '../../types';

export const useMiddleware = (middleware: RequestHandler): MethodDecorator => {
  return (target, key, desc) => {
    const registeredMiddlewares = Reflect.getMetadata(MetadataKeys.Middleware, target, key);

    Reflect.defineMetadata(MetadataKeys.Middleware, [...registeredMiddlewares, middleware], target, key);
  };
};
