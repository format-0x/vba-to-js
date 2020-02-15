// TODO: add proper types
import { Block, Identifier, Root } from './nodes';

declare var $1: string;

const dispatch = (pattern: string, actionFunc?: Function, options: object = {}) => {
  let action: string;

  if (actionFunc) {
    action = `${actionFunc}`.replace(/\bnew /g, '$&this.yy.');
    action = `$$ = ${action};`;
  } else {
    action = '$$ = $1;';
  }

  return [pattern, action, options];
};

const grammar = {
  Root: [
    dispatch('', function () {
      return new Root(new Block());
    }),
  ],
  Identifier: [
    dispatch('IDENTIFIER', function () {
      return new Identifier($1);
    }),
  ]
};

export default grammar;
