import { LexerOptions, Pos, ShorthandTypes, Token, TokenLocation, TokenOptions, TokenType, TYPES } from './types';
import { COMPARE, IDENTIFIER, LOGICAL, MATH, MODIFIER, NEWLINE, NUMBER, OPERATOR, STRING, WHITESPACE } from './patterns';
import { clean } from './util';

export default class Lexer {
  private chunk: string = '';
  private chunkColumn: number = 0;
  private chunkLine: number = 0;
  private chunkOffset: number = 0;
  private lines: string[] = [];
  private tokens: Token[] = [];
  private referencedVariables: string[] = [];

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
    let tag: string;

    if (!(match = IDENTIFIER.exec(this.chunk))) {
      return 0;
    }

    const [input, id, shorthand] = match;
    const [prev] = this.prev() || [];

    if (shorthand) {
      this.tokens.push(this.makeToken(TokenType.Identifier, id));
      this.tokens.push(this.makeToken(TokenType.As, 'As'));
      this.tokens.push(this.makeToken(TokenType.Type, ShorthandTypes[<keyof typeof ShorthandTypes>shorthand]));

      return input.length;
    }

    if (id === 'As') {
      tag = TokenType.As;
    } else if (prev === TokenType.As) {
      if (!(id in TYPES)) {
        // TODO: add proper implementation (error)
        console.error(`error: ${id}`);
      }

      tag = TokenType.Type;
    } else if (LOGICAL.includes(id)) {
      tag = 'LOGICAL';
    } else if (prev === 'END' && id === 'Sub') {
      this.tokens.pop();

      tag = 'SUB_END';
    } else if (prev === 'END' && id === 'Function') {
      this.tokens.pop();

      tag = 'FUNCTION_END';
    } else if (prev === 'END' && id === 'If') {
      this.tokens.pop();

      tag = 'IF_END';
    } else if (prev === 'EXIT' && id === 'Do') {
      this.tokens.pop();

      tag = 'BREAK';
    } else if (prev === 'EXIT' && (id === 'Sub' || id === 'Function')) {
      this.tokens.pop();

      tag = 'RETURN';
    } else if (id === 'Sub') {
      tag = 'SUB_START';
    } else if (id === 'Do') {
      tag = 'DO';
    } else if (id === 'Loop') {
      tag = 'LOOP';
    } else if (id === 'While') {
      tag = 'WHILE';
    } else if (id === 'Until') {
      tag = 'UNTIL';
    } else if (id === 'Function') {
      tag = 'FUNCTION_START';
    } else if (id === 'End') {
      tag = 'END';
    } else if (id === 'Exit') {
      tag = 'EXIT';
    } else if (id === 'If') {
      tag = 'IF';
    } else if (id === 'Then') {
      tag = 'THEN';
    } else if (id === 'ElseIf') {
      tag = 'ELSE_IF';
    } else if (id === 'Else') {
      tag = 'ELSE';
    } else if (id === 'Call') {
      tag = 'CALL';
    } else {
      tag = TokenType.Identifier;
    }
    
    const token = this.makeToken(tag, id);

    this.tokens.push(token);

    return id.length;
  }

  prev() {
    const [prev] = this.tokens.slice(-1);
    return prev;
  }

  modifierToken(): number {
    let match: RegExpExecArray | null;

    if (!(match = MODIFIER.exec(this.chunk))) {
      return 0;
    }

    const [modifier] = match;
    const token = this.makeToken(TokenType.Modifier, modifier);

    this.tokens.push(token);

    return modifier.length;
  }

  literalToken(): number {
    let match: RegExpExecArray | null;
    let value: string;

    ((match = OPERATOR.exec(this.chunk)))
      ? ([value] = match)
      : (value = this.chunk.charAt(0));

    let tag = value;
    const [prev] = this.prev();
    // TODO: add proper implementation
    if (value === '=' && !['IDENTIFIER', 'TYPE'].includes(prev)) {
      tag = 'COMPARE';
    } else if (value === '*' && prev === TokenType.Type) {
      tag = 'SIZE';
    } else if (COMPARE.includes(value)) {
      tag = 'COMPARE';
    }
    // TODO: add proper implementation

    if (value === ';') {
      tag = 'TERMINATOR';
    }

    this.tokens.push(this.makeToken(tag, value));

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

  numberToken(): number {
    let match: RegExpExecArray | null;

    if (!(match = NUMBER.exec(this.chunk))) {
      return 0;
    }

    const [number] = match;
    const token = this.makeToken(TokenType.Number, number);

    this.tokens.push(token);

    return number.length;
  }

  newlineToken(): number {
    let match: RegExpExecArray | null;

    if (!(match = NEWLINE.exec(this.chunk))) {
      return 0;
    }

    const [input] = match;

    this.tokens.push(this.makeToken('TERMINATOR', input));

    return input.length;
  }

  tokenize(code: string, options: LexerOptions = {}): Token[] {
    code = clean(code);
    this.lines = code.split(/(?<=\n)/);

    while ((this.chunk = code.slice(this.chunkOffset))) {
      const consumed = this.modifierToken() || this.identifierToken() || this.newlineToken() || this.whitespaceToken() || this.stringToken() || this.numberToken() || this.literalToken();

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
