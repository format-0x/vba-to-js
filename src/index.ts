import Lexer from './lexer';
import bnf from './grammar';
import * as nodes from './nodes';
import { Token } from './types';

const Parser = require('jison').Parser;

const parser = new Parser({
  bnf,
  startSymbol: 'Literal',
});

parser.yy = nodes;

parser.lexer = {
  lex: function (): string {
    let tag: string;
    const token = parser.tokens[this.pos++];

    if (token) {
      [tag, this.yytext, this.yylloc] = token;
      this.yylineno = this.yylloc.first_line;
    } else {
      tag = '';
    }

    return tag;
  },
  options: {
    ranges: true,
  },
  setInput: function (tokens: Token[]): void {
    parser.tokens = tokens;
    this.pos = 0;
  },
};

const lexer = new Lexer();

const compile = (code: string, options: object) => {
  options = { ...options };
  const tokens = lexer.tokenize(code, options);
  const nodes = parser.parse(tokens);
};