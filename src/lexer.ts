import { LexerOptions, Pos, Token, TokenLocation, TokenOptions, TokenType } from './types';
import { IDENTIFIER, NEWLINE, STRING, WHITESPACE } from './patterns';

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

    return [index, lineIndex];
  }

  stringToken(): number {
    const [raw, quote, string] = STRING.exec(this.chunk) || [];

    if (!raw) {
      return 0;
    }

    const token = this.makeToken(TokenType.String, raw);

    this.tokens.push(token);

    return raw.length;
  }

  identifierToken(): number {
    let match: RegExpExecArray | null;

    if (!(match = IDENTIFIER.exec(this.chunk))) {
      return 0;
    }

    const [id] = match;

    const token = this.makeToken(TokenType.Identifier, id);

    this.tokens.push(token);

    return id.length;
  }

  literalToken(): number {
    const value = this.chunk.charAt(0);

    // TODO: add proper implementation
    if (value === '=') {
      this.tokens.push(this.makeToken(value, value));
    }

    // TODO: add proper implementation
    if (value === ';') {
      this.tokens.push(this.makeToken('TERMINATOR', value));
    }

    return value.length;
  }

  makeLocation(offset: number, length: number): TokenLocation {
    const [first_column, first_line] = this.getPos(offset);
    const [last_column, last_line] = this.getPos(offset + length - 1);
    const [last_column_exclusive, last_line_exclusive] = this.getPos(offset + length);

    return {
      first_column,
      first_line,
      last_column,
      last_column_exclusive,
      last_line,
      last_line_exclusive,
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
      const consumed = this.identifierToken() || this.newlineToken() || this.whitespaceToken() || this.stringToken() || this.literalToken();

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
