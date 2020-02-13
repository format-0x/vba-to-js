// TODO: add proper types
import { Block, Identifier, Root } from './nodes';

const dispatch = (pattern: string, actionFunc?: Function, options: object = {}) => {
  let action: string;

  if (actionFunc) {
    action = `(${actionFunc})()`;
    action = action.replace(/\bnew /g, '$&yy.');
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
};

export default grammar;
