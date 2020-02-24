import { Alternative, Grammar, Options } from './types';
import {
  Assign,
  Block, Code,
  IdentifierLiteral, Literal,
  NumberLiteral,
  Op, Parameter, Return,
  Root,
  StringLiteral, Type,
  Value,
  VariableDeclaration, VariableDeclarationList
} from './nodes';

declare const $1: any;
declare const $2: any;
declare const $3: any;
declare const $4: any;
declare const $5: any;
declare const $6: any;

const dispatch = (pattern: string, actionFunc?: Function, options: Options = {}): Alternative => {
  let action: string;
  const { makeReturn, ...rest } = options;

  if (actionFunc) {
    action = `${actionFunc}`.replace(/nodes_1\./g, '');
    action = action.replace(/\bnew /g, '$&yy.');
    action = action.replace(/\b(?:Block\.wrap)\b/g, 'yy.$&');
    action = `$$ = (${action})();`;

    if (makeReturn) {
      options = rest;
      action = `return ${action}`;
    }
  } else {
    action = '$$ = $1;';
  }

  return [pattern, action, options];
};

const grammar: Grammar = {
  Root: [
    dispatch('', function () {
      return new Root(new Block());
    }, { makeReturn: true }),
    dispatch('Body', function () {
      return new Root($1);
    }, { makeReturn: true }),
  ],
  Body: [
    dispatch('Line', function () {
      return Block.wrap([$1]);
    }),
    dispatch('Body TERMINATOR Line', function () {
      $1.push($3);
      return $1;
    }),
    dispatch('Body TERMINATOR'),
  ],
  Line: [dispatch('Expression'), dispatch('Statement')],
  Statement: [dispatch('VariableDeclaration'), dispatch('Return')],
  Expression: [
    dispatch('Value'),
    dispatch('Code'),
    dispatch('Operation'),
    dispatch('Assign')
  ],
  Identifier: [
    dispatch('IDENTIFIER', function () {
      return new IdentifierLiteral($1);
    }),
  ],
  Number: [
    dispatch('NUMBER', function () {
      return new NumberLiteral($1);
    }),
  ],
  String: [
    dispatch('STRING', function () {
      return new StringLiteral($1);
    }),
  ],
  Literal: [
    dispatch('String'), dispatch('Number')
  ],
  Assign: [
    dispatch('Assignable = Expression', function () {
      return new Assign($1, $3);
    }),
    dispatch('Assignable = TERMINATOR Expression', function () {
      return new Assign($1, $4);
    }),
  ],
  ParamList: [
    dispatch('', function () {
      return [];
    }),
    dispatch('ParamVariable', function () {
      return [$1];
    }),
    dispatch('ParamList , ParamVariable', function () {
      return [...$1, $3];
    }),
  ],
  ParamVariable: [
    dispatch('Identifier', function () {
      return new Parameter($1);
    }),
    dispatch('Identifier AS TYPE', function () {
      return new Parameter($1, new Type($3));
    }),
    dispatch('Identifier AS TYPE = Expression', function () {
      return new Parameter($1, new Type($3), $5);
    }),
  ],
  SimpleAssignable: [
    dispatch('Identifier', function () {
      return new Value($1);
    }),
  ],
  Return: [
    dispatch('RETURN Expression', function () {
      return new Return($2);
    }),
    dispatch('RETURN', function () {
      return new Return();
    }),
  ],
  Code: [
    dispatch('SUB_START Identifier PARAM_START ParamList PARAM_END Body SUB_END', function () {
      return new Code($2, $4, Block.wrap([$6]));
    }),
  ],
  Assignable: [
    dispatch('SimpleAssignable'),
  ],
  Value: [
    dispatch('Assignable'),
    dispatch('Literal', function () {
      return new Value($1);
    }),
  ],
  VariableDeclaration: [
    dispatch('MODIFIER VariableList', function () {
      return new VariableDeclarationList($2, $1);
    }),
  ],
  VariableList: [
    dispatch('Variable', function () {
      return [$1];
    }),
    dispatch('VariableList , Variable', function () {
      return [...$1, $3];
    }),
  ],
  Variable: [
    dispatch('Identifier', function () {
      return new VariableDeclaration($1);
    }),
    dispatch('Identifier AS TYPE', function () {
      return new VariableDeclaration($1, new Type($3));
    }),
    dispatch('Identifier AS TYPE SIZE NUMBER', function () {
      return new VariableDeclaration($1, new Type($3, { size: $5 }));
    }),
  ],
  Operation: [
    dispatch('Expression & Expression', function () {
      return new Op('+', $1, $3);
    }),
    dispatch('Expression + Expression', function () {
      return new Op('+', $1, $3);
    }),
    dispatch('Expression - Expression', function () {
      return new Op('-', $1, $3);
    }),
    dispatch('Expression % Expression', function () {
      return new Op('%', $1, $3);
    }),
    dispatch('Expression \\ Expression', function () {
      return new Op('/', $1, $3);
    }),
    dispatch('Expression * Expression', function () {
      return new Op('*', $1, $3);
    }),
    dispatch('Expression / Expression', function () {
      return new Op('/', $1, $3);
    }),
    dispatch('Expression ^ Expression', function () {
      return new Op('^', $1, $3);
    }),
    dispatch('Expression COMPARE Expression', function () {
      return new Op($2, $1, $3);
    }),
    dispatch('Expression LOGICAL Expression', function () {
      return new Op($2, $1, $3);
    }),
  ],
};

export default grammar;
