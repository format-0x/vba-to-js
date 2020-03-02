export const IDENTIFIER = /^(?!\d)((?:\w+))([%&#$!@])?/;
export const WHITESPACE = /^\s/;
export const NEWLINE = /^\n/;
export const STRING = /^(["'])(.*?)\1/;
export const NUMBER = /^\d+/;
export const OPERATOR = /^(?:[-+*/\\^%=&]|<>|[><]=?|x?or|and|not|eqv|imp)/i;
export const MODIFIER = /^(?:(?:re)?dim|static|private|public)/i;

export const MATH = ['-', '+', '%', '\\', '*', '/', '^'];
export const COMPARE = ['<>', '>', '<=', '>=', '<'];
export const LOGICAL = ['imp', 'eqv', 'xor', 'or', 'and', 'not'];

export const operators = [
  ['right', 'RETURN'],
  ['left', '='],
  ['left', 'IF'],
  ['left', 'ELSE', 'ELSE_IF'],
  ['left', 'LOGICAL'],
  ['left', 'COMPARE'],
  ['left', '&'],
  ['left', '-', '+'],
  ['left', '%'],
  ['left', '\\'],
  ['left', '*', '/'],
  ['left', '^'],
  ['left', 'CALL'],
  ['left', '(', ')'],
];
