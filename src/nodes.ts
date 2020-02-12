import { SourceLocation } from '@babel/types';
import { addToPrototype, fragmentsToString, jisonLocationToBabelLocation, NO, YES } from './util';
import {
  BlockType, JS_FORBIDDEN, TokenLocation, Variable, VariableKind, VariablePosition, VariableType
} from './types';

export class Scope {
  private variables: Variable[] = [];
  private positions: VariablePosition = {};

  constructor(
    private parent: Scope,
    private expressions: Block,
    private method: Code,
    private referencedVariables: object = {},
  ) {}

  add(
    name: string,
    value: any = null,
    kind: VariableKind = 'Variable',
    type: VariableType = 'Variant',
  ): void {
    if (Object.prototype.hasOwnProperty.call(this.positions, name)) {
      // TODO: handle type reassignment
      this.variables[this.positions[name]].value = value;
    } else {
      this.positions[name] = this.variables.push({ name, type, kind, value });
    }
  }

  check(name: string): boolean {
    // TODO: need parent lookup?
    return !!this.find(name);
  }

  find(name: string): Variable | undefined {
    return this.variables.find(({ name: variableName }) => name === variableName);
  }
}

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

export class Value extends Base {

}

// TODO: add proper types
export class Literal<T extends string> extends Base {
  public value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  compileNode(options: object): CodeFragment[] {
    return [this.makeCode(this.value)];
  }

  get props(): object {
    return { value: this.value };
  }
}

export class Identifier extends Literal<string> {
  // TODO: add proper types
  eachName(iterator: Function) {
    return iterator(this);
  }

  get props(): object {
    return { name: this.value };
  }
}

export class Parameter extends Base {
  constructor(private name: Identifier, private value: Value) {
    super();
  }

  compileToFragments(options: object): CodeFragment[] {
    return this.name.compileToFragments(options);
  }

  eachName(iterator: Function) {
    return iterator(this.name.value, this.name, this);
  }
}

Parameter.prototype.children = ['name', 'value'];

export class Code extends Base {
  constructor(
    private params: any[] = [],
    private body: Block = new Block([]),
  ) {
    super();
  }

  makeScope(parentScope: Scope): Scope {
    return new Scope(parentScope, this.body, this);
  }

  eachParamName(iterator: Function) {
    return this.params.reduce((acc, param) => [...acc, param.eachName(iterator)], []);
  }

  compileNode(options: object): CodeFragment[] {
    this.eachParamName((name: string, node: Identifier, param: Parameter) => {
      if (name in JS_FORBIDDEN) {
        name = `_${name}`;
      }
    });

    return [];
  }
}

Code.prototype.children = ['params', 'body'];