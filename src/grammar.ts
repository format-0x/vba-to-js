// TODO: add proper types
import { Alternative, Grammar, Options } from './types';
import {Assign, Block, IdentifierLiteral, NumberLiteral, Op, Root, StringLiteral, Value} from './nodes';

declare const $1: any;
declare const $2: any;
declare const $3: any;
declare const $4: any;

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
  Line: [dispatch('Expression')],
  Expression: [dispatch('Value'), dispatch('Code'), dispatch('Operation'), dispatch('Assign')],
  Identifier: [
    dispatch('IDENTIFIER', function () {
      return new IdentifierLiteral($1);
    }),
  ],
  AlphaNumeric: [
    dispatch('NUMBER', function () {
      return new NumberLiteral($1);
    }),
    dispatch('String'),
  ],
  String: [
    dispatch('STRING', function () {
      return new StringLiteral($1);
    }),
  ],
  Literal: [
    dispatch('AlphaNumeric'),
  ],
  Assign: [
    dispatch('Assignable = Expression', function () {
      return new Assign($1, $3);
    }),
    dispatch('Assignable = TERMINATOR Expression', function () {
      return new Assign($1, $4);
    }),
  ],
  SimpleAssignable: [
    dispatch('Identifier', function () {
      return new Value($1);
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
