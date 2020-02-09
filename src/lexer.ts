import { LexerOptions, Pos, Token, TokenLocation, TokenOptions } from './types';
import { IDENTIFIER, NEWLINE, WHITESPACE } from './patterns';

export default class Lexer {
  private chunk: string = '';
  private chunkColumn: number = 0;
  private chunkLine: number = 0;
  private chunkOffset: number = 0;
  private lines: string[] = [];
  private tokens: Token[] = [];

  getPos(offset: number): Pos {
    let index = offset, lineIndex = 0;

    for (const line of this.lines) {
      if (line[index]) {
        return [index, lineIndex];
      }

      index -= line.length;
      lineIndex++;
    }

    throw new Error(`Cannot find char at index: ${offset}`);
  }

  identifierToken(): number {
    let match: RegExpExecArray | null;

    if (!(match = IDENTIFIER.exec(this.chunk))) {
      return 0;
    }

    const [id] = match;

    const token = this.makeToken('IDENTIFIER', id);

    this.tokens.push(token);

    return id.length;
  }

  makeLocation(offset: number, length: number): TokenLocation {
    const [first_column, first_line] = this.getPos(offset);
    const [last_column, last_line] = this.getPos(offset + length - 1);

    return {
      first_column,
      first_line,
      last_column,
      last_line,
      range: [offset, offset + length - 1],
    };
  }

  makeToken(tag: string, value: string, { length }: TokenOptions = { length: value.length }): Token {
    const location = this.makeLocation(this.chunkOffset, length);
    return [tag, value, location];
  }

  newlineToken(): number {
    let match: RegExpExecArray | null;

    if (!(match = NEWLINE.exec(this.chunk))) {
      return 0;
    }

    const [input] = match;

    return input.length;
  }

  tokenize(code: string, options: LexerOptions = {}): Token[] {
    this.lines = code.split(/(?<=\n)/);

    while ((this.chunk = code.slice(this.chunkOffset))) {
      const consumed = this.identifierToken() || this.whitespaceToken() || this.newlineToken();

      this.chunkOffset += consumed;
    }

    return this.tokens;
  }

  whitespaceToken(): number {
    let match: RegExpExecArray | null;

    if (!(match = WHITESPACE.exec(this.chunk))) {
      return 0;
    }

    const [input] = match;

    return input.length;
  }
}
