export const IDENTIFIER = /^(?!\d)(?:\w+)/;
export const WHITESPACE = /^\s+/;
export const NEWLINE = /^\n+/;
export const STRING = /^(["'])(.*?)\1/;
export const NUMBER = /^\d+/;
export const OPERATOR = /^(?:[-+*/\\^%=&]|<>|[><]=?|x?or|and|not|eqv|imp)/i;

export const MATH = ['-', '+', '%', '\\', '*', '/', '^'];
export const COMPARE = ['<>', '>', '<=', '>=', '<'];
export const LOGICAL = ['Imp', 'Eqv', 'Xor', 'Or', 'And', 'Not'];

export const operators = [
  ['left', 'LOGICAL'],
  ['left', 'COMPARE', '='],
  ['left', '&'],
  ['left', '-', '+'],
  ['left', '%'],
  ['left', '\\'],
  ['left', '*', '/'],
  ['left', '^'],
];
