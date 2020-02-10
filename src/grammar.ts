// TODO: add proper types
const dispatch = (pattern: string, actionFunc?: Function, options: object = {}) => {
  let action: string;

  if (actionFunc) {
    action = `(${actionFunc})()`;
    action = action.replace(/\bnew /g, '$&yy.');
    action = `$$ = ${action}`;
  } else {
    action = '$$ = $1;';
  }

  return [pattern, action, options];
};

const grammar = {
  Literal: [
    dispatch('IDENTIFIER'),
  ],
};

export default grammar;
