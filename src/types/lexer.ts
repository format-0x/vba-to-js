export interface LexerOptions {}

export interface TokenLocation {
  first_column: number;
  first_line: number;
  last_column: number;
  last_column_exclusive: number;
  last_line: number;
  last_line_exclusive: number;
  range: TokenLocationRange;
}

export interface TokenOptions {
  length: number;
}

export type Pos = [number, number];

export type Token = [string, string, TokenLocation];

export type TokenLocationRange = [number, number];

export enum TokenType {
  Identifier = 'IDENTIFIER',
  String = 'STRING',
  StringType = 'STRING_TYPE',
  Number = 'NUMBER',
  New = 'NEW',
  Modifier = 'MODIFIER',
  FunctionModifier = 'FUNCTION_MODIFIER',
  ParamModifier = 'PARAM_MODIFIER',
  As = 'AS',
  Type = 'TYPE',
  CallStart = 'CALL_START',
  CallEnd = 'CALL_END',
  Property = 'PROPERTY',
  ParamArray = 'PARAM_ARRAY',
  Const = 'CONST',
  Dim = 'DIM',
  Unary = 'UNARY',
}
