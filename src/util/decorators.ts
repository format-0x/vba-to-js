export const addToPrototype = <T>(value: T): PropertyDecorator => {
  return (target: any, key: string | symbol): void => {
    target[key] = value;
  };
};
