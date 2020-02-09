import { SourceLocation } from '@babel/types';
import { jisonLocationToBabelLocation, addToPrototype } from './util';
import { TokenLocation } from './types';

abstract class Base {
  @addToPrototype<Base[]>([])
  public children: Base[] = [];
  abstract location: TokenLocation;

  get type(): string {
    return this.constructor.name;
  }

  getLocation(): SourceLocation {
    return jisonLocationToBabelLocation(this.location);
  }
}

Base.prototype.children = [];
