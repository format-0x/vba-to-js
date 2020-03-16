import { LexerOptions, Pos, ShorthandTypes, Token, TokenLocation, TokenOptions, TokenType, TYPES } from './types';
import {
  COMPARE,
  FUNCTION_MODIFIER,
  IDENTIFIER,
  LOGICAL,
  MATH,
  MODIFIER,
  NEWLINE,
  NUMBER,
  OPERATOR, PARAM_MODIFIER,
  STRING,
  WHITESPACE
} from './patterns';
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

      if (shorthand === ':=') {
        this.tokens.push(this.makeToken(':=', ':='));
      } else {
        this.tokens.push(this.makeToken(TokenType.As, 'As'));
        this.tokens.push(this.makeToken(TokenType.Type, ShorthandTypes[<keyof typeof ShorthandTypes>shorthand]));
      }

      return input.length;
    }

    if (id === 'As') {
      tag = TokenType.As;
    } else if (id === 'New') {
      tag = TokenType.New;
    } else if (prev === '.') {
      tag = TokenType.Property;
    } else if (prev === TokenType.As) {
      if (!(id in TYPES)) {
        // TODO: add proper implementation (error)
        console.error(`error: ${id}`);
      }

      if (id === 'String') {
        tag = TokenType.StringType;
      } else {
        tag = TokenType.Type;
      }
    } else if (prev === TokenType.New) {
      tag = TokenType.Type;
    } else if (LOGICAL.includes(id)) {
      tag = 'LOGICAL';
    } else if (prev === 'END' && id === 'Sub') {
      this.tokens.pop();

      tag = 'SUB_END';
    } else if (prev === 'SELECT' && id === 'Case') {
      this.tokens.pop();

      tag = 'SELECT_START';
    } else if (prev === 'END' && id === 'Select') {
      this.tokens.pop();

      tag = 'SELECT_END';
    } else if (prev === 'END' && id === 'Function') {
      this.tokens.pop();

      tag = 'FUNCTION_END';
    } else if (prev === 'END' && id === 'If') {
      this.tokens.pop();

      tag = 'IF_END';
    } else if (prev === 'END' && id === 'With') {
      this.tokens.pop();

      tag = 'WITH_END';
    } else if (prev === 'CASE' && id === 'Else') {
      this.tokens.pop();

      tag = 'DEFAULT_CASE';
    } else if (prev === 'EXIT' && (id === 'Do' || id === 'For')) {
      this.tokens.pop();

      tag = 'BREAK';
    } else if (prev === 'EXIT' && (id === 'Sub' || id === 'Function')) {
      this.tokens.pop();

      tag = 'RETURN';
    } else if (id === 'Sub') {
      tag = 'SUB_START';
    } else if (id === 'Select') {
      tag = 'SELECT';
    } else if (id === 'Step') {
      tag = 'STEP';
    } else if (id === 'For') {
      tag = 'FOR';
    } else if (id === 'To') {
      tag = 'TO';
    } else if (id === 'Next') {
      tag = 'NEXT';
    } else if (id === 'Case') {
      tag = 'CASE';
    } else if (id === 'Do') {
      tag = 'DO';
    } else if (id === 'Loop') {
      tag = 'LOOP';
    } else if (id === 'While') {
      tag = 'WHILE';
    } else if (id === 'Until') {
      tag = 'UNTIL';
    } else if (id === 'Wend') {
      tag = 'WEND';
    } else if (id === 'Function') {
      tag = 'FUNCTION_START';
    } else if (id === 'End') {
      tag = 'END';
    } else if (id === 'Exit') {
      tag = 'EXIT';
    } else if (id === 'If') {
      tag = 'IF';
    } else if (id === 'With') {
      tag = 'WITH';
    } else if (id === 'Then') {
      tag = 'THEN';
    } else if (id === 'ElseIf') {
      tag = 'ELSE_IF';
    } else if (id === 'Else') {
      tag = 'ELSE';
    } else if (id === 'Mod') {
      tag = 'MOD';
    } else if (id === 'Call') {
      tag = 'CALL';
    } else {
      tag = TokenType.Identifier;
    }
    
    const token = this.makeToken(tag, id);

    this.tokens.push(token);

    return id.length;
  }

  prev(offset: number = -1) {
    const [prev] = this.tokens.slice(offset);
    return prev;
  }

  modifierToken(): number {
    let match: RegExpExecArray | null;
    let tag: string;

    if ((match = FUNCTION_MODIFIER.exec(this.chunk))) {
      tag = TokenType.FunctionModifier;
    } else if ((match = MODIFIER.exec(this.chunk))) {
      tag = TokenType.Modifier;
    } else if ((match = PARAM_MODIFIER.exec(this.chunk))) {
      tag = TokenType.ParamModifier;
    } else {
      return 0;
    }

    const [, modifier] = match;
    const token = this.makeToken(tag, modifier);

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
    if (COMPARE.includes(value)) {
      tag = 'COMPARE';
    }
    // TODO: add proper implementation

    if (value === ':') {
      tag = 'TERMINATOR';
    } else if (value === '.' && (['TERMINATOR', 'WITH'].includes(prev))) {
      this.tokens.push(this.makeToken('THIS', 'this'));
    } else if (value === ',' && ['(', ','].includes(prev)) {
      this.tokens.push(this.makeToken('ARG_SKIP', ''));
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
    const [prev] = this.prev();

    // TODO: add proper implementation
    if (prev === 'TERMINATOR') {
      return input.length;
    }

    if (prev === '_') {
      this.tokens.pop();
    } else {
      this.tokens.push(this.makeToken('TERMINATOR', input));
    }

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
