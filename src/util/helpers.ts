import { SourceLocation } from '@babel/types';
import { TokenLocation } from '../types';
import { CodeFragment } from '../nodes';
import { FUNCTION_ARGS } from '../patterns';

export const jisonLocationToBabelLocation = ({
  first_column,
  first_line,
  last_column_exclusive,
  last_line_exclusive,
}: TokenLocation): SourceLocation => ({
  start: {
    line: first_line + 1,
    column: first_column,
  },
  end: {
    line: last_line_exclusive + 1,
    column: last_column_exclusive,
  },
});

export const fragmentsToString = (fragments: CodeFragment[], separator: string = ''): string => {
  return fragments.join(separator);
};

export const YES = (): boolean => true;
export const NO = (): boolean => false;

// TODO: add proper implementation
export const clean = (code: string): string => {
  return code
    .replace(/'.*$/gm, '')
    .replace(/\n+/g, '\n')
    .trim();
};

const isNotUndefined = (value: any) => typeof value !== 'undefined';

export const handleNamedArgs = (func: Function, rawArgs: { [key: string]: any }) => {
  const match = func.toString().match(FUNCTION_ARGS);

  if (!match) throw new Error('');

  const [, args] = match;
  const handledArgs = args
    .replace(/\s+/g, '')
    .split(',')
    .map((arg, i) => {
      const [argument] = [rawArgs[arg], rawArgs[i]].filter(isNotUndefined);

      return argument;
    });

  return func(...handledArgs);
};
