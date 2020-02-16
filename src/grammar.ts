// TODO: add proper types
import {Block, Identifier, Root, Value} from './nodes';
import { Alternative, Grammar } from './types';

declare var $1: any;

const dispatch = (pattern: string, actionFunc?: Function, options: object = {}): Alternative => {
  let action: string;

  if (actionFunc) {
    action = `${actionFunc}`.replace(/\bnew /g, '$&this.yy.');
    action = `$$ = ${action};`;

    // TODO: add proper implementation
    if (!pattern) {
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
    }),
    dispatch('Body', function () {
      return new Root($1);
    }),
  ],
  Body: [
    dispatch('Line', function () {
      return Block.wrap([$1]);
    }),
  ],
  Line: [dispatch('Expression')],
  Expression: [dispatch('Value')],
  Identifier: [
    dispatch('IDENTIFIER', function () {
      return new Identifier($1);
    }),
  ],
  Assign: [dispatch('Value')],
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
};

export default grammar;
