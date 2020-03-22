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

export function handleNamedArgs(this: any, func: Function, rawArgs: { [key: string]: any }) {
  const match = func.toString().match(FUNCTION_ARGS);

  if (!match) throw new Error('');

  const [, args] = match;
  const extractedArgs = args
    .replace(/(?:\s+|=[^),]+)/g, '')
    .split(',');
  const [lastArg] = extractedArgs.slice(-1);
  const seenRest = /^\./.test(lastArg);
  const used: string[] = [];
  const handledArgs = extractedArgs
    .slice(0, extractedArgs.length - +seenRest)
    .map((arg, i) => {
      const [argument] = [rawArgs[arg], rawArgs[i]].filter(isNotUndefined);

      used.push(arg, i + '');

      return argument;
    });

  if (seenRest) {
    const rest = Object.keys(rawArgs)
      .filter((key) => !used.includes(key))
      .map((key) => rawArgs[key]);

    handledArgs.push(...rest);
  }

  return func.apply(this, handledArgs);
}
