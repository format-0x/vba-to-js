import { SourceLocation } from '@babel/types';
import { addToPrototype, fragmentsToString, jisonLocationToBabelLocation, NO, YES } from './util';
import {
  BlockType, Options, TokenLocation, Variable, VariableKind, VariablePosition, VariableType
} from './types';

export class Scope {
  private _variables: Variable[] = [];
  private positions: VariablePosition = {};

  constructor(
    private parent: Scope | null,
    public expressions: Block,
    private method: Code | null,
    private referencedVariables: string[] = [],
  ) {}

  add(
    name: string,
    value?: any,
    kind: VariableKind = 'Variable',
    type: VariableType = 'Variant',
  ): void {
    if (Object.prototype.hasOwnProperty.call(this.positions, name)) {
      // TODO: handle type reassignment
      this._variables[this.positions[name]].value = value;
    } else {
      const assigned = value !== undefined;
      this.positions[name] = this._variables.push({ name, type, kind, value, assigned });
    }
  }

  check(name: string): boolean {
    // TODO: need parent lookup?
    return !!this.find(name);
  }

  freeVariable(name: string, options: Options = {}): string {
    let temp: string;
    let index = 0;

    do {
      temp = `${name}${++index}`;
    }
    while (this.find(temp) || this.referencedVariables.includes(name));

    if (options.reserve) {
      this.add(temp);
    }

    return temp;
  }

  find(name: string): Variable | undefined {
    return this._variables.find(({ name: variableName }) => name === variableName);
  }

  get variables() {
    return this._variables.filter(({ kind }) => kind === 'Variable');
  }
}

export class CodeFragment {
  constructor(private code: Function | string) {}

  toString(): string {
    return `${this.code}`;
  }
}

abstract class Base {
  abstract compileNode(options: object): CodeFragment[];
  @addToPrototype<(Base | string)[]>([]) // TODO: add proper types
  public children: (Base | string)[] = []; // TODO: add proper types
  private location: TokenLocation = {} as TokenLocation; // TODO: add proper types

  astNode() {
    const { loc, props, type } = this;

    return { loc, type, ...props };
  }

  compile(options: Options) {
    return fragmentsToString(this.compileToFragments(options));
  }

  compileToFragments(options: Options): CodeFragment[] {
    return this.compileNode(options);
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

  constructor(nodes: Base[] = []) {
    super();
    this.expressions = nodes.flat(Infinity);
  }

  compileRoot(options: Options) {
    return this.compileWithDeclarations(options);
  }

  compileWithDeclarations(options: Options) {
    const post = this.compileNode(options);
    const { scope } = options;
    const fragments = [];

    if (scope?.expressions === this) {
      const { variables } = scope;

      if (variables.length) {
        fragments.push(this.makeCode('var '));

        variables.forEach(({ name, value, assigned }, i) => {
          fragments.push(this.makeCode(name));

          if (assigned) {
            fragments.push(this.makeCode(` = ${value}`));
          }

          if (i !== variables.length - 1) {
            fragments.push(this.makeCode(', '));
          }
        });

        fragments.push(this.makeCode(';\n'));
      }
    }

    return [...fragments, ...post];
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
    this.initializeScope(options);
    const fragments: CodeFragment[] = this.body.compileRoot(options);

    return [
      this.makeCode('(function () {\n'),
      ...fragments,
      this.makeCode('\n})();\n'),
    ];
  }

  initializeScope(options: Options) {
    const { referencedVariables } = options;

    options.scope = new Scope(null, this.body, null, referencedVariables);
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
  constructor(private base: Base) {
    super();
  }

  compileNode(options: Options = {}) {
    return this.base.compileToFragments(options);
  }
}

// TODO: add proper types
export class Literal<T extends string> extends Base {
  public value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  compileNode(options: Options): CodeFragment[] {
    return [this.makeCode(this.value)];
  }

  get props(): object {
    return { value: this.value };
  }
}

export class StringLiteral extends Literal<string> {
  compileNode(options: Options): CodeFragment[] {
    return this.compileToFragments(options);
  }
}

export class IdentifierLiteral extends Literal<string> {
  get props(): object {
    return { name: this.value };
  }
}

export class Parameter extends Base {
  constructor(private name: IdentifierLiteral, private value: Value) {
    super();
  }

  compileNode(options: object): CodeFragment[] {
    return [];
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
    private params: Parameter[] = [],
    private body: Block = new Block([]),
  ) {
    super();
  }

  makeScope(parentScope: Scope): Scope {
    return new Scope(parentScope, this.body, this);
  }

  eachParamName(iterator: Function) {
    // TODO: add proper types
    return this.params.reduce((acc, param) => [...acc, param.eachName(iterator)], [] as any);
  }

  compileNode(options: Required<Pick<Options, 'scope'>>): CodeFragment[] {
    options.scope = this.makeScope(options.scope);

    this.params.forEach((param) => {
      options.scope.add(fragmentsToString(param.compileToFragments(options)));
    });

    const output = [this.makeCode('function(')];

    this.params.forEach((param, i) => {
      if (i) {
        output.push(this.makeCode(' ,'));
      }

      output.push(...param.compileToFragments(options));
    });

    output.push(
      this.makeCode(') {\n'),
      ...this.body.compileWithDeclarations(options),
      this.makeCode('\n}'),
    );

    return output;
  }
}

Code.prototype.children = ['params', 'body'];

export class Assign extends Base {
  constructor(private variable: IdentifierLiteral, private value: Value) {
    super();
  }

  compileNode(options: object): CodeFragment[] {
    const val = this.value.compileToFragments(options);
    const name = this.variable.compileToFragments(options);

    return [...name, this.makeCode('='), ...val];
  }
}

Assign.prototype.children = ['variable', 'value'];
