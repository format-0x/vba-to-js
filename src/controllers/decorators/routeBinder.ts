import { MetadataKeys, Methods } from '../../types';

const routeBinder = (method: Methods): (route: string) => MethodDecorator => {
  return (route) => (target, key, desc) => {
    Reflect.defineMetadata(
      MetadataKeys.Route,
      route,
      target,
      key,
    );
    Reflect.defineMetadata(
      MetadataKeys.Method,
      method,
      target,
      key,
    );
  };
};

export const get = routeBinder(Methods.GET);
export const put = routeBinder(Methods.PUT);
export const del = routeBinder(Methods.DELETE);
export const post = routeBinder(Methods.POST);
