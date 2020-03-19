export const IDENTIFIER = /^(?!\d|_)((?:[а-я\w]+))([%&#$!@]|:=)?/i;
export const WHITESPACE = /^\s/;
export const NEWLINE = /^\n/;
export const STRING = /^(["'])(.*?)\1/;
export const NUMBER = /^-?\d+(?:\.\d+)?/;
export const OPERATOR = /^(?:[-+*/\\^%=&]|<>|><|[><]=?|x?or|and|not|eqv|imp)/i;
export const MODIFIER = /^(static|private|public)\s/i;
export const DIM = /^((?:re)?dim)\s/i;
export const UNARY = /^(?:not)/i;
export const CONST = /^(const)\s/i;
export const FUNCTION_MODIFIER = /^(static|private|public|friend)\s+(?=function|sub)/i;
export const PARAM_MODIFIER = /^(optional|by(?:val|ref))/i;
export const FUNCTION_ARGS = /^(?:function)?\s*[^(]*\(\s*([^)]*)\)/;

export const MATH = ['-', '+', 'Mod', '\\', '*', '/', '^'];
export const COMPARE = ['><','<>', '>', '<=', '>=', '<'];
export const LOGICAL = ['Xor', 'Or', 'And', 'Not'];

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
  ['left', 'UNARY'],
  ['left', '.'],
];
