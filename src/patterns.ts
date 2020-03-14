export const IDENTIFIER = /^(?!\d|_)((?:\w+))([%&#$!@]|:=)?/;
export const WHITESPACE = /^\s/;
export const NEWLINE = /^\n/;
export const STRING = /^(["'])(.*?)\1/;
export const NUMBER = /^\d+/;
export const OPERATOR = /^(?:[-+*/\\^%=&]|<>|[><]=?|x?or|and|not|eqv|imp)/i;
export const MODIFIER = /^(?:(?:re)?dim|static|private|public)/i;
export const FUNCTION_ARGS = /^(?:function)?\s*[^(]*\(\s*([^)]*)\)/;

export const MATH = ['-', '+', 'Mod', '\\', '*', '/', '^'];
export const COMPARE = ['<>', '>', '<=', '>=', '<'];
export const LOGICAL = ['Imp', 'Eqv', 'Xor', 'Or', 'And', 'Not'];

export const operators = [
  ['right', 'RETURN'],
  ['left', ':='],
  ['left', '='],
  ['left', 'IF'],
  ['left', 'ELSE', 'ELSE_IF'],
  ['left', 'LOGICAL'],
  ['left', 'COMPARE'],
  ['left', '&'],
  ['left', '-', '+'],
  ['left', 'MOD'],
  ['left', '\\'],
  ['left', '*', '/'],
  ['left', '^'],
  ['left', 'CALL'],
  ['left', '(', ')'],
  ['left', '.'],
];
