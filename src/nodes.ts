import { SourceLocation } from '@babel/types';
import { jisonLocationToBabelLocation, addToPrototype, fragmentsToString, NO, YES } from './util';
import { BlockType, TokenLocation } from './types';

export class CodeFragment {
  constructor(private code: Function | string) {}

  toString(): string {
    return `${this.code}`;
  }
}


abstract class Base {
  @addToPrototype<(Base | string)[]>([]) // TODO: add proper types
  public children: (Base | string)[] = []; // TODO: add proper types
  private location: TokenLocation = {} as TokenLocation; // TODO: add proper types

  astNode() {
    const { loc, props, type } = this;

    return { loc, type, ...props };
  }

  compile(options: object) {
    return fragmentsToString(this.compileToFragments(options));
  }

  compileToFragments(options: object): CodeFragment[] {
    return [];
  }

  joinFragments(fragmentsList: CodeFragment[][], separator: string): CodeFragment[] {
    return fragmentsList.reduce((acc, fragments, i) => {
      const joinFragment: CodeFragment[] = [];

      if (i) {
        joinFragment.push(this.makeCode(separator));
      }

      return [...acc, ...joinFragment, ...fragments];
    }, []);
  }

  get type(): string {
    return this.constructor.name;
  }

  get loc(): SourceLocation {
    return jisonLocationToBabelLocation(this.location);
  }

  get props(): object {
    return {};
  }

  makeCode(code: Function | string): CodeFragment {
    return new CodeFragment(code);
  }
}

Base.prototype.children = [];

export class Block extends Base {
  private expressions: Base[];
  public isRootBlock: () => boolean = NO;
  public isClassBody: () => boolean = NO;

  static wrap(nodes: Base[]) {
    return new Block(nodes);
  }

  constructor(nodes: Base[]) {
    super();
    this.expressions = nodes.flat(Infinity);
  }

  compileRoot(options: object) {
    return [];
  }

  get push() {
    return this.expressions.push.bind(this.expressions);
  }

  get pop() {
    return this.expressions.pop.bind(this.expressions);
  }

  get unshift() {
    return this.expressions.unshift.bind(this.expressions);
  }

  get type(): BlockType {
    switch (true) {
    case this.isRootBlock():
      return BlockType.RootBlock;
    case this.isClassBody():
      return BlockType.ClassBody;
    default:
      return BlockType.BlockStatement;
    }
  }

  isEmpty(): boolean {
    return !this.expressions.length;
  }

  compileNode(options: object = {}) {
    const compiledNodes: CodeFragment[][] = [];

    for (const node of this.expressions) {
      if (node instanceof Block) {
        compiledNodes.push(node.compileNode(options));
      } else {
        compiledNodes.push(node.compileToFragments(options));
      }
    }

    if (!compiledNodes.length) {
      return [this.makeCode('void 0')];
    }

    return this.joinFragments(compiledNodes, '\n');
  }
}

Block.prototype.children = ['expressions'];

export class Root extends Base {
  private body: Block;

  constructor(body: Block) {
    super();
    this.body = body;
    this.body.isRootBlock = YES;
  }

  compileNode(options: object): CodeFragment[] {
    const fragments: CodeFragment[] = this.body.compileRoot(options);

    return [
      this.makeCode('(function () {\n'),
      ...fragments,
      this.makeCode('\n})();\n'),
    ];
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
}

export class Code extends Base {
  constructor(
    private params: string[] = [],
    private body: Block = new Block([]),
  ) {
    super();
  }
}
