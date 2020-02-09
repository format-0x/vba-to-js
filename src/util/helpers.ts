import { SourceLocation } from '@babel/types';
import { TokenLocation } from '../types';

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
