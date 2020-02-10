export const addToPrototype = <T>(value: T): PropertyDecorator => {
  // TODO: add proper types
  return (target: any, key: string | symbol): void => {
    target[key] = value;
  };
};
