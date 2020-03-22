import { MetadataKeys, Methods } from '../../types';
import { AppRouter } from '../../routes';

export const controller = (prefix: string = ''): ClassDecorator => {
  return (target) => {
    Object.getOwnPropertyNames(target.prototype).forEach((key) => {
      const routeController = target.prototype[key];
      const route = Reflect.getMetadata(MetadataKeys.Route, target.prototype, key);
      const method: Methods = Reflect.getMetadata(MetadataKeys.Method, target.prototype, key);
      const middlewares = []
        .concat(Reflect.getMetadata(MetadataKeys.Middleware, target.prototype, key), routeController)
        .filter(Boolean);

      if (route) {
        AppRouter.getInstance()[method](`${prefix}${route}`, ...middlewares);
      }
    });
  };
};