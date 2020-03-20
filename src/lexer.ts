import { LexerOptions, Pos, ShorthandTypes, Token, TokenLocation, TokenOptions, TokenType, TYPES } from './types';
import {
  BOOLEAN,
  COMPARE, CONST, DIM,
  FUNCTION_MODIFIER,
  IDENTIFIER,
  LOGICAL,
  MATH,
  MODIFIER,
  NEWLINE,
  NUMBER,
  OPERATOR, PARAM_MODIFIER,
  STRING, UNARY,
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

    const [input, identifier, shorthand] = match;
    const [prev] = this.prev() || [];
    const [prevprev] = this.prev(-2) || [];
    const id = identifier.toLowerCase();

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

    if (id === 'as') {
      tag = TokenType.As;
    } else if (id === 'new') {
      tag = TokenType.New;
    } else if (prev === '.') {
      tag = TokenType.Property;
    } else if (prev === TokenType.As) {
      if (!(`${id[0].toUpperCase()}${id.slice(1)}` in TYPES)) {
        // TODO: add proper implementation (error)
        console.error(`error: ${id}`);
      }

      if (id === 'string') {
        tag = TokenType.StringType;
      } else {
        tag = TokenType.Type;
      }
    } else if (prev === TokenType.New && prevprev === TokenType.As) {
      tag = TokenType.Type;
    } else if (UNARY.test(id)) {
      tag = TokenType.Unary;
    } else if (BOOLEAN.test(id)) {
      tag = TokenType.Boolean;
    } else if (LOGICAL.includes(id)) {
      tag = 'LOGICAL';
    } else if (prev === 'END' && id === 'sub') {
      this.tokens.pop();

      tag = 'SUB_END';
    } else if (prev === 'SELECT' && id === 'case') {
      this.tokens.pop();

      tag = 'SELECT_START';
    } else if (prev === 'END' && id === 'select') {
      this.tokens.pop();

      tag = 'SELECT_END';
    } else if (prev === 'END' && id === 'function') {
      this.tokens.pop();

      tag = 'FUNCTION_END';
    } else if (prev === 'END' && id === 'if') {
      this.tokens.pop();

      tag = 'IF_END';
    } else if (prev === 'END' && id === 'with') {
      this.tokens.pop();

      tag = 'WITH_END';
    } else if (prev === 'CASE' && id === 'else') {
      this.tokens.pop();

      tag = 'DEFAULT_CASE';
    } else if (prev === 'EXIT' && (id === 'do' || id === 'for')) {
      this.tokens.pop();

      tag = 'BREAK';
    } else if (prev === 'EXIT' && (id === 'sub' || id === 'function')) {
      this.tokens.pop();

      tag = 'RETURN';
    } else if (id === 'sub') {
      tag = 'SUB_START';
    } else if (id === 'select') {
      tag = 'SELECT';
    } else if (id === 'set') {
      tag = 'SET';
    } else if (id === 'let') {
      tag = 'LET';
    } else if (id === 'step') {
      tag = 'STEP';
    } else if (id === 'for') {
      tag = 'FOR';
    } else if (id === 'to') {
      tag = 'TO';
    } else if (id === 'nothing') {
      tag = TokenType.Nothing;
    } else if (id === 'next') {
      tag = 'NEXT';
    } else if (id === 'case') {
      tag = 'CASE';
    } else if (id === 'do') {
      tag = 'DO';
    } else if (id === 'loop') {
      tag = 'LOOP';
    } else if (id === 'while') {
      tag = 'WHILE';
    } else if (id === 'until') {
      tag = 'UNTIL';
    } else if (id === 'paramarray') {
      tag = TokenType.ParamArray;
    } else if (id === 'wend') {
      tag = 'WEND';
    } else if (id === 'function') {
      tag = 'FUNCTION_START';
    } else if (id === 'end') {
      tag = 'END';
    } else if (id === 'exit') {
      tag = 'EXIT';
    } else if (id === 'if') {
      tag = 'IF';
    } else if (id === 'with') {
      tag = 'WITH';
    } else if (id === 'then') {
      tag = 'THEN';
    } else if (id === 'elseif') {
      tag = 'ELSE_IF';
    } else if (id === 'else') {
      tag = 'ELSE';
    } else if (id === 'mod') {
      tag = 'MOD';
    } else if (id === 'call') {
      tag = 'CALL';
    } else {
      tag = TokenType.Identifier;
    }
    
    const token = this.makeToken(tag, identifier);

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
    } else if ((match = DIM.exec(this.chunk))) {
      tag = TokenType.Dim;
    } else if ((match = CONST.exec(this.chunk))) {
      tag = TokenType.Const;
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
