import { promises } from 'fs';
import beautifier from 'js-beautify';
import Lexer from './lexer';
import bnf from './grammar';
import * as nodes from './nodes';
import { Options, Token } from './types';
import { Root } from './nodes';
import { fragmentsToString } from './util';
import { operators } from './patterns';

const Parser = require('jison').Parser;
const patterns = Object.values(bnf).reduce((acc: string[], [[pattern]]) => {
  return [...acc, ...pattern.split(/\s+/)];
}, []);
const tokens = [...new Set(patterns)].filter((token) => !bnf[token]).join(' ');

const parser = new Parser({
  operators,
  bnf,
  startSymbol: 'Root',
  tokens,
});

parser.yy = nodes;

parser.lexer = {
  yylloc: {
    range: [],
  },
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

const compile = async (path: string, options: Options = {}) => {
  const code = await promises.readFile(path, 'utf8');
  options = { ...options };

  const tokens: Token[] = lexer.tokenize(code, options);
  const referencedVariables = tokens.reduce((acc: string[], [tag, value]) => {
    if (tag === 'IDENTIFIER') {
      return [...acc, value];
    }

    return acc;
  }, []);

  options = { ...options, referencedVariables };

  const nodes: Root = parser.parse(tokens);
  const fragments = nodes.compileToFragments(options);

  return fragmentsToString(fragments);
};

compile('vba/sub.vb')
  .then(beautifier.js.bind(beautifier))
  .then(console.log);
