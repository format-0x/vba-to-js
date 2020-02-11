import { SourceLocation } from '@babel/types';
import { TokenLocation } from '../types';
import { CodeFragment } from '../nodes';

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
