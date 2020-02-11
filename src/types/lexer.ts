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
}
