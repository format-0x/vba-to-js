import { SourceLocation } from '@babel/types';
import { addToPrototype, fragmentsToString, jisonLocationToBabelLocation, NO, YES } from './util';
import {
  BlockType,
  Options,
  TokenLocation,
  ValueParams,
  VariableParams,
  VariableKind,
  VariablePosition,
  VariableType,
  Modifier,
  OptionsWithScope, Kind
} from './types';

export class Scope {
  private _variables: VariableParams[] = [];
  private positions: VariablePosition = {};

  constructor(
    private parent: Scope | null,
    public expressions: Block,
    private method: Code | null,
    private referencedVariables: string[] = [],
  ) {}

  propagate(): Scope {
    if (!this.parent) return this;

    return this.parent.propagate();
  }

  add(
    name: string,
    type: VariableType = 'Variant',
    value?: any,
    kind: VariableKind = 'Variable',
  ): void {
    if (Object.prototype.hasOwnProperty.call(this.positions, name)) {
      // TODO: handle type reassignment
      this._variables[this.positions[name]].value = value;
    } else {
      const assigned = value !== undefined;
      this.positions[name] = this._variables.push({ name, type, kind, value, assigned }) - 1;
    }
  }

  check(name: string): boolean {
    return !!(this.find(name) || this.parent?.check(name));
  }

  freeVariable(name: string, options: Options = {}): string {
    let temp: string;
    let index = 0;

    do {
      temp = `${name}${++index}`;
    }
    while (this.referencedVariables.includes(temp) || this.find(temp));

    if (options.reserve) {
      this.add(temp);
    }

    this.referencedVariables.push(temp);

    return temp;
  }

  find(name: string): VariableParams | undefined {
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
  abstract compileNode(options: Options): CodeFragment[];
  @addToPrototype<string[]>([]) // TODO: add proper types
  public children: string[] = []; // TODO: add proper types
  private location: TokenLocation = {} as TokenLocation; // TODO: add proper types

  astNode() {
    const { loc, nodeProps, nodeType: type } = this;

    return { loc, type, ...nodeProps };
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

  get nodeType(): string {
    return this.constructor.name;
  }

  get loc(): SourceLocation {
    return jisonLocationToBabelLocation(this.location);
  }

  get nodeProps(): object {
    return {};
  }

  invert(): Op {
    return new Op('!', this);
  }

  makeCode(code: Function | string): CodeFragment {
    return new CodeFragment(code);
  }

  wrapInParentheses(fragments: CodeFragment[]): CodeFragment[] {
    return [this.makeCode('('), ...fragments, this.makeCode(')')];
  }
}

Base.prototype.children = [];

export class Call extends Base {
  constructor(private variable: Value, private args: Base[] = []) {
    super();
  }

  compileNode(options: Options): CodeFragment[] {
    const args = this.args.reduce((acc, arg) => {
      return [...acc, arg.compileToFragments(options)];
    }, <CodeFragment[][]>[]);
    const compiledArgs = this.joinFragments(args, ', ');

    return [
      ...this.variable.compileToFragments(options),
      this.makeCode('('),
      ...compiledArgs,
      this.makeCode(')'),
    ];
  }
}

Base.prototype.children = ['variable', 'args'];

export class Return extends Base {
  constructor(private expression?: Value) {
    super();
  }

  compileNode(options: Options): CodeFragment[] {
    const ret = [this.makeCode('return')];

    if (this.expression) {
      const expr = this.expression.compileToFragments(options);
      ret.push(this.makeCode(' '), ...expr);
    }

    ret.push(this.makeCode(';'));

    return ret;
  }
}

export class Break extends Base {
  compileNode(options: Options): CodeFragment[] {
    return [this.makeCode('break;')];
  }
}

export class Block extends Base {
  public expressions: Base[];
  public isRootBlock: () => boolean = NO;
  public isClassBody: () => boolean = NO;

  static wrap(nodes: Base[]) {
    return new Block(nodes);
  }

  constructor(nodes: Base[] = []) {
    super();
    this.expressions = nodes.flat(Infinity);
  }

  compileRoot(options: OptionsWithScope) {
    return this.compileWithDeclarations(options);
  }

  compileWithDeclarations(options: OptionsWithScope) {
    const { scope } = options;
    const fragments = [];
    const post = this.compileNode(options);
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

  get nodeType(): BlockType {
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

  compileNode(options: Options = {}): CodeFragment[] {
    const compiledNodes: CodeFragment[][] = [];

    for (const node of this.expressions) {
      if (node instanceof Block) {
        compiledNodes.push(node.compileNode(options));
      } else {
        const compiledNode = node.compileToFragments(options);

        if (!(node instanceof VariableDeclarationList)) {
          compiledNodes.push(compiledNode);
        }
      }
    }

    if (!compiledNodes.length) {
      return new Return().compileToFragments(options);
    }

    return this.joinFragments(compiledNodes, '\n');
  }
}

Block.prototype.children = ['expressions'];

export class Op extends Base {
  constructor(
    private operator: string,
    private leftHandSide: Base, // TODO: add proper types
    private rightHandSide?: Base, // TODO: add proper types
  ) {
    super();
  }

  compileNode(options: Options): CodeFragment[] {
    const lhs = this.leftHandSide.compileToFragments(options);
    const result: CodeFragment[][] = [lhs, [this.makeCode(this.operator)]];

    if (this.rightHandSide) {
      result.push(this.rightHandSide.compileToFragments(options));
    } else {
      result.reverse();
    }

    return this.wrapInParentheses(result.flat());
  }
}

export class Root extends Base {
  private body: Block;

  constructor(body: Block) {
    super();
    this.body = body;
    this.body.isRootBlock = YES;
  }

  compileNode(options: OptionsWithScope): CodeFragment[] {
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

  get nodeType(): string {
    return 'File';
  }

  get nodeProps(): object {
    const program = this.body.compileNode();
    return { program };
  }
}

Root.prototype.children = ['body'];

export class Value extends Base {
  constructor(public base: Literal, public params: ValueParams = {}) {
    super();
  }

  compileNode(options: Options = {}) {
    return this.base.compileToFragments(options);
  }
}

// TODO: add proper types
export class Literal extends Base {
  constructor(public value: any) {
    super();
  }

  compileNode(options: Options): CodeFragment[] {
    return [this.makeCode(this.value)];
  }

  get nodeProps(): object {
    return { value: this.value };
  }
}

export class IdentifierLiteral extends Literal {
  get nodeProps(): object {
    return { name: this.value };
  }
}

export class VariableDeclaration extends Base {
  constructor(
    protected name: IdentifierLiteral,
    protected variableType: Type = new Type('Variant'),
    protected initializer?: Value,
  ) {
    super();
  }

  declare(options: Required<Pick<Options, 'scope' | 'modifier'>>): void {
    const { scope, modifier } = options;
    // TODO: add proper implementation (modifier rules)
    let value: string | undefined;

    if (this.initializer) {
      const [init] = this.initializer.compileToFragments(options);

      value = init.toString();
    }

    scope.add(this.name.value, this.variableType.type, value);
  }

  compileNode(options: Options): CodeFragment[] {
    const name = this.name.compileToFragments(options);

    if (this.initializer) {
      const value = this.initializer.compileToFragments(options);

      return [...name, this.makeCode('='), ...value];
    }

    return name;
  }
}

export class If extends Base {
  private isChain: boolean = false;

  constructor(
    private condition: Base,
    private body: Block,
    private elseBody?: Base | If,
  ) {
    super();
  }

  addElse(elseBody: Base): this {
    if (this.isChain) {
      (<If>this.elseBody).addElse(elseBody);
    } else {
      this.isChain = elseBody instanceof If;
      this.elseBody = elseBody;
    }

    return this;
  }

  compileNode(options: Options): CodeFragment[] {
    const condition = this.condition.compileToFragments(options);
    const body = this.body.compileToFragments(options);
    const ifPart: CodeFragment[] = [
      this.makeCode('if ('),
      ...condition,
      this.makeCode(') {\n'),
      ...body,
      this.makeCode('\n}'),
    ];

    if (!this.elseBody) {
      return ifPart;
    }

    const result = [...ifPart, this.makeCode(' else ')];
    const elseBody = this.elseBody.compileToFragments(options);

    if (this.isChain) {
      result.push(...elseBody);
    } else {
      result.push(
        this.makeCode('{\n'),
        ...elseBody,
        this.makeCode('\n}'),
      );
    }

    return result;
  }
}

export class Parameter extends VariableDeclaration {
  declare(options: OptionsWithScope): void {
    const { scope } = options;
    let value: string | undefined;
    // TODO: add proper implementation (modifier rules)
    if (this.initializer) {
      const [init] = this.initializer.compileToFragments(options);

      value = init.toString();
    }

    scope.add(this.name.value, this.variableType.type, value, 'Parameter');
  }
}

export class Code extends Base {
  constructor(
    private name: IdentifierLiteral,
    private params: Parameter[] = [],
    private body: Block = new Block([]),
  ) {
    super();
  }

  makeScope(parentScope: Scope): Scope {
    return new Scope(parentScope, this.body, this);
  }

  compileNode(options: OptionsWithScope): CodeFragment[] {
    options = { ...options };
    options.scope = this.makeScope(options.scope);
    options.scope.add(
      this.name.value,
      'Object',
      null,
      'Function',
    );

    const name = this.name.compileToFragments(options);
    const output: CodeFragment[] = [this.makeCode('function '), ...name, this.makeCode('(')];

    this.params.forEach((param, i) => {
      param.declare(options);

      if (i) {
        output.push(this.makeCode(', '));
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

export class BooleanLiteral extends Literal {}

export class DateLiteral extends Literal {}

export class StringLiteral extends Literal {}

export class NumberLiteral extends Literal {}

export class Type {
  constructor(public type: VariableType, public params: object = {}) {}
}

export class VariableDeclarationList extends Base {
  constructor(private variableList: VariableDeclaration[], private modifier: Modifier) {
    super();
  }

  compileNode(options: OptionsWithScope): CodeFragment[] {
    const { modifier } = this;

    this.variableList.forEach((variable) => {
      variable.declare({ ...options, modifier });
    });

    return [];
  }
}

VariableDeclaration.prototype.children = ['variableList'];

export class Assign extends Base {
  constructor(public variable: Value, public value: Value) {
    super();
  }

  compileNode(options: OptionsWithScope): CodeFragment[] {
    const { scope } = options;
    const name = this.variable.base.value;
    const declared = scope.check(name);

    if (!declared) {
      scope.add(name);
    }

    const { kind } = scope.find(name) || {};

    if (kind === 'Function') {
      return new Return(this.value).compileToFragments(options);
    } else {
      const identifier = this.variable.compileToFragments(options);
      const val = this.value.compileToFragments(options);

      return [...identifier, this.makeCode('='), ...val];
    }
  }
}

Assign.prototype.children = ['variable', 'value'];

export class Parens extends Base {
  constructor(private body: Base) {
    super();
  }

  compileNode(options: Options): CodeFragment[] {
    return this.wrapInParentheses(this.body.compileToFragments(options));
  }
}

export class While extends Base {
  constructor(
    private condition: Base,
    private body: Base,
    private post: boolean = false,
    private inverted: boolean = false,
  ) {
    super();

    if (inverted) {
      this.condition = condition.invert();
    }
  }

  compileNode(options: Options): CodeFragment[] {
    const result: CodeFragment[][] = [];
    const body = this.body.compileToFragments(options);
    const condition = this.condition.compileToFragments(options);

    result.push([this.makeCode('while ('), ...condition, this.makeCode(')')]);
    result.push([this.makeCode('{\n'), ...body, this.makeCode('\n}')]);

    if (this.post) {
      result.push([this.makeCode('do')]);
      result.reverse();
    }

    return result.flat();
  }
}

export class For extends Base {
  private body: Block = new Block();

  constructor(
    private init: Assign,
    private end: Value,
    private step: Value = new Value(new NumberLiteral('1')),
  ) {
    super();
  }

  addBody(body: Block) {
    this.body = body;

    return this;
  }

  compileNode(options: OptionsWithScope): CodeFragment[] {
    const { variable } = this.init;
    const name = options.scope.freeVariable('end');
    const end = new Assign(new Value(new IdentifierLiteral(name)), this.end);
    const compiledStep = this.step.compileToFragments(options);
    const compiledStart = this.init.compileToFragments(options);
    const compiledEnd = end.compileToFragments(options);
    const compiledVariable = variable.compileToFragments(options);

    const initClause = [...compiledStart, this.makeCode(', '), ...compiledEnd];
    const conditionClause = [...compiledVariable, this.makeCode(' < '), this.makeCode(name)];
    const postClause = [...compiledVariable, this.makeCode(' += '), ...compiledStep];

    return [
      this.makeCode('for ('),
      ...this.joinFragments([initClause, conditionClause, postClause], '; '),
      this.makeCode(') {\n'),
      ...this.body.compileToFragments(options),
      this.makeCode('\n}'),
    ];
  }
}

export class Switch extends Base {
  constructor(
    private subject: Base,
    private cases: SwitchCase[],
  ) {
    super();
  }

  compileNode(options: Options): CodeFragment[] {
    const subject = this.subject.compileToFragments(options);
    const cases = this.cases.reduce((acc: CodeFragment[], switchCase: SwitchCase) => {
      return [...acc, ...switchCase.compileToFragments(options)];
    }, []);

    return [
      this.makeCode('switch ('),
      ...subject,
      this.makeCode(') {\n'),
      ...cases,
      this.makeCode('}'),
    ];
  }
}

export class SwitchCase extends Base {
  constructor(private expressions: Base[], private body: Block) {
    super();
  }

  compileNode(options: Options): CodeFragment[] {
    const compiledExpressions = this.expressions.reduce((acc: CodeFragment[][], expr: Base) => {
      return [...acc, expr.compileToFragments(options)];
    }, []);
    const cases = compiledExpressions.map((fragment) => {
      return [
        this.makeCode('case '),
        ...fragment,
        this.makeCode(':'),
      ];
    });

    if (!this.expressions.length) {
      cases.push([this.makeCode('default:')]);
    }

    const body = this.body.compileToFragments(options);
    const br = [...new Break().compileToFragments(options), this.makeCode('\n')];

    return this.joinFragments([...cases, body, br], '\n');
  }
}
