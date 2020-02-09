export interface LexerOptions {}

export interface TokenLocation {
  first_column: number;
  first_line: number;
  last_column: number;
  last_line: number;
  range: TokenLocationRange;
}

export interface TokenOptions {
  length: number;
}

export type Pos = [number, number];

export type Token = [string, string, TokenLocation];

export type TokenLocationRange = [number, number];
