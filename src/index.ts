import Lexer from './lexer';
import { Token } from './types';

const Parser = require('jison').Parser;

const parser = new Parser({});

parser.lexer = {
  lex: function () {
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
