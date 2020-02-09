import { SourceLocation } from '@babel/types';
import { jisonLocationToBabelLocation } from './util/helpers';
import { TokenLocation } from './types';

abstract class Base {
  abstract location: TokenLocation;

  get type(): string {
    return this.constructor.name;
  }

  getLocation(): SourceLocation {
    return jisonLocationToBabelLocation(this.location);
  }
}
