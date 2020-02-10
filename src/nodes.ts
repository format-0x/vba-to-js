import { SourceLocation } from '@babel/types';
import { jisonLocationToBabelLocation, addToPrototype } from './util';
import { TokenLocation } from './types';

export class CodeFragment {
  constructor(private code: Function | string) {}

  fragmentsToString(fragments: CodeFragment[], separator: string = ''): string {
    return fragments.join(separator);
  }

  toString(): string {
    return `${this.code}`;
  }
}

abstract class Base {
  abstract props: object; // TODO: add proper types
  @addToPrototype<(Base | string)[]>([]) // TODO: add proper types
  public children: (Base | string)[] = []; // TODO: add proper types
  private location: TokenLocation = {} as TokenLocation; // TODO: add proper types

  compileNode() {
    const { loc, props, type } = this;

    return { loc, type, ...props };
  }

  get type(): string {
    return this.constructor.name;
  }

  get loc(): SourceLocation {
    return jisonLocationToBabelLocation(this.location);
  }

  makeCode(code: Function | string): CodeFragment {
    return new CodeFragment(code);
  }
}

Base.prototype.children = [];

export class Root extends Base {
  private body: Base;

  constructor(body: Base) {
    super();
    this.body = body;
  }

  get type(): string {
    return 'File';
  }

  get props(): object {
    const program = this.body.compileNode();
    return { program };
  }
}

Root.prototype.children = ['body'];

export class Literal<T> extends Base {
  private value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  get props(): object {
    return {};
  }
}
