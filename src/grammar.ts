import { Alternative, Grammar, Options } from './types';
import {
  Access,
  Assign,
  Block, Break, Call, Code, For,
  IdentifierLiteral, If, Literal,
  NumberLiteral,
  Op, Parameter, Parens, PropertyName, Return,
  Root,
  StringLiteral, Switch, SwitchCase, Type,
  Value,
  VariableDeclaration, VariableDeclarationList, While
} from './nodes';

declare const $1: any;
declare const $2: any;
declare const $3: any;
declare const $4: any;
declare const $5: any;
declare const $6: any;

const dispatch = (pattern: string, actionFunc?: Function, options: Options = {}): Alternative => {
  let action: string;
  const { makeReturn, ...rest } = options;

  if (actionFunc) {
    action = `${actionFunc}`.replace(/nodes_1\./g, '');
    action = action.replace(/\bnew /g, '$&yy.');
    action = action.replace(/\b(?:Block\.wrap)\b/g, 'yy.$&');
    action = `$$ = (${action})();`;

    if (makeReturn) {
      options = rest;
      action = `return ${action}`;
    }
  } else {
    action = '$$ = $1;';
  }

  return [pattern, action, options];
};

const grammar: Grammar = {
  Root: [
    dispatch('', function () {
      return new Root(new Block());
    }, { makeReturn: true }),
    dispatch('Body', function () {
      return new Root($1);
    }, { makeReturn: true }),
  ],
  Body: [
    dispatch('Line', function () {
      return Block.wrap([$1]);
    }),
    dispatch('Body TERMINATOR Line', function () {
      $1.push($3);
      return $1;
    }),
  ],
  Line: [dispatch('Expression'), dispatch('Statement')],
  Statement: [
    dispatch('VariableDeclaration'),
    dispatch('Return'),
    dispatch('If'),
    dispatch('PostWhile'),
    dispatch('PreWhile'),
    dispatch('For'),
    dispatch('Wend'),
    dispatch('Break'),
    dispatch('Switch'),
    dispatch('Call'),
  ],
  Expression: [
    dispatch('Value'),
    dispatch('Code'),
    dispatch('Operation'),
    dispatch('Assign'),
  ],
  Identifier: [
    dispatch('IDENTIFIER', function () {
      return new IdentifierLiteral($1);
    }),
  ],
  Property: [
    dispatch('PROPERTY', function () {
      return new PropertyName($1);
    }),
  ],
  Number: [
    dispatch('NUMBER', function () {
      return new NumberLiteral($1);
    }),
  ],
  String: [
    dispatch('STRING', function () {
      return new StringLiteral($1);
    }),
  ],
  Literal: [
    dispatch('String'), dispatch('Number')
  ],
  Assign: [
    dispatch('Assignable = Expression', function () {
      return new Assign($1, $3);
    }),
  ],
  Params: [
    dispatch('( ParamList )', function () {
      return $2;
    }),
  ],
  ParamList: [
    dispatch('', function () {
      return [];
    }),
    dispatch('ParamVariable', function () {
      return [$1];
    }),
    dispatch('ParamList , ParamVariable', function () {
      return [...$1, $3];
    }),
  ],
  ParamVariable: [
    dispatch('Identifier', function () {
      return new Parameter($1);
    }),
    dispatch('Identifier AS TYPE', function () {
      return new Parameter($1, new Type($3));
    }),
    dispatch('Identifier AS TYPE = Expression', function () {
      return new Parameter($1, new Type($3), $5);
    }),
  ],
  SimpleAssignable: [
    dispatch('Identifier', function () {
      return new Value($1);
    }),
    dispatch('Value Accessor', function () {
      return $1.add($2);
    }),
  ],
  Break: [
    dispatch('BREAK', function () {
      return new Break();
    }),
  ],
  Return: [
    dispatch('RETURN Expression', function () {
      return new Return($2);
    }),
    dispatch('RETURN', function () {
      return new Return();
    }),
  ],
  Code: [
    dispatch('SUB_START Identifier Params TERMINATOR Body TERMINATOR SUB_END', function () {
      return new Code($2, $3, Block.wrap([$5]));
    }),
    dispatch('FUNCTION_START Identifier Params TERMINATOR Body TERMINATOR FUNCTION_END', function () {
      return new Code($2, $3, Block.wrap([$5]));
    }),
  ],
  Assignable: [
    dispatch('SimpleAssignable'),
  ],
  Value: [
    dispatch('Assignable'),
    dispatch('Parenthetical', function () {
      return new Value($1);
    }),
    dispatch('Literal', function () {
      return new Value($1);
    }),
    dispatch('Invocation', function () {
      return new Value($1);
    }),
  ],
  Accessor: [
    dispatch('. Property', function () {
      return new Access($2);
    }),
  ],
  Invocation: [
    dispatch('Value Args', function () {
      return new Call($1, $2);
    }),
  ],
  Call: [
    dispatch('CALL Value Args', function () {
      return new Call($2, $3);
    }),
  ],
  Args: [
    dispatch('( )', function () {
      return [];
    }),
    dispatch('( ArgList )', function () {
      return [].concat($2);
    }),
  ],
  ArgList: [
    dispatch('Arg'),
    dispatch('ArgList , Arg', function () {
      return [].concat($1, $3);
    }),
  ],
  Arg: [
    dispatch('Expression'),
  ],
  Parenthetical: [
    dispatch('( Operation )', function () {
      return new Parens($2);
    }),
  ],
  VariableDeclaration: [
    dispatch('MODIFIER VariableList', function () {
      return new VariableDeclarationList($2, $1);
    }),
  ],
  VariableList: [
    dispatch('Variable', function () {
      return [$1];
    }),
    dispatch('VariableList , Variable', function () {
      return [...$1, $3];
    }),
  ],
  Variable: [
    dispatch('Identifier', function () {
      return new VariableDeclaration($1);
    }),
    dispatch('Identifier AS TYPE', function () {
      return new VariableDeclaration($1, new Type($3));
    }),
    dispatch('Identifier AS TYPE SIZE NUMBER', function () {
      return new VariableDeclaration($1, new Type($3, { size: $5 }));
    }),
  ],
  For: [
    dispatch('ForClause TERMINATOR Body TERMINATOR NEXT', function () {
      return $1.addBody($3);
    }),
    dispatch('ForClause TERMINATOR Body TERMINATOR NEXT Value', function () {
      return $1.addBody($3);
    }),
  ],
  ForClause: [
    dispatch('FOR Assign TO Value', function () {
      return new For($2, $4);
    }),
    dispatch('FOR Assign TO Value STEP Value', function () {
      return new For($2, $4, $6);
    }),
  ],
  Wend: [
    dispatch('WHILE Expression TERMINATOR Body TERMINATOR WEND', function () {
      return new While($2, $4);
    }),
  ],
  PostWhile: [
    dispatch('DO TERMINATOR WhileBody WHILE Expression', function () {
      return new While($5, $3, true);
    }),
    dispatch('DO TERMINATOR WhileBody UNTIL Expression', function () {
      return new While($5, $3, true, true);
    }),
  ],
  PreWhile: [
    dispatch('DO WHILE Expression TERMINATOR WhileBody', function () {
      return new While($3, $5);
    }),
    dispatch('DO UNTIL Expression TERMINATOR WhileBody', function () {
      return new While($3, $5, false, true);
    }),
  ],
  WhileBody: [
    dispatch('Body TERMINATOR LOOP', function () {
      return $1;
    }),
  ],
  Switch: [
    dispatch('SELECT_START Expression TERMINATOR SwitchCaseList SELECT_END', function () {
      return new Switch($2, $4);
    }),
    dispatch('SELECT_START Expression TERMINATOR DefaultSwitchCaseList SELECT_END', function () {
      return new Switch($2, $4);
    }),
  ],
  DefaultSwitchCaseList: [
    dispatch('SwitchCaseList DEFAULT_CASE TERMINATOR Body TERMINATOR', function () {
      return [...$1, new SwitchCase([], $4)];
    }),
  ],
  SwitchCaseList: [
    dispatch('SwitchCase', function () {
      return [$1];
    }),
    dispatch('SwitchCaseList SwitchCase', function () {
      return [...$1, $2];
    }),
  ],
  SwitchCase: [
    dispatch('CASE CaseExpressions TERMINATOR Body TERMINATOR', function () {
      return new SwitchCase($2, $4);
    }),
  ],
  CaseExpressions: [
    dispatch('Expression', function () {
      return [$1];
    }),
    dispatch('CaseExpressions , Expression', function () {
      return [...$1, $3];
    }),
  ],
  If: [
    dispatch('IfLine'),
    dispatch('IfBlock'),
  ],
  IfLine: [
    dispatch('IF IfLineClause', function () {
      return $2;
    }),
    dispatch('IF IfLineClause ELSE Line', function () {
      return $2.addElse($4);
    }),
  ],
  IfBlock: [
    dispatch('IF IfBlockClause IF_END', function () {
      return $2;
    }),
    dispatch('IF IfBlockClause ElseIf IF_END', function () {
      return $2.addElse($3);
    }),
    dispatch('IF IfBlockClause ElseIf ELSE TERMINATOR Body TERMINATOR IF_END', function () {
      return $2.addElse($3).addElse($6);
    }),
    dispatch('IF IfBlockClause ELSE TERMINATOR Body TERMINATOR IF_END', function () {
      return $2.addElse($5);
    }),
  ],
  IfLineClause: [
    dispatch('Expression THEN Line', function () {
      return new If($1, $3);
    }),
  ],
  IfBlockClause: [
    dispatch('Expression THEN TERMINATOR Body TERMINATOR', function () {
      return new If($1, $4);
    }),
  ],
  ElseIf: [
    dispatch('ELSE_IF IfBlockClause', function () {
      return $2;
    }),
    dispatch('ElseIf ELSE_IF IfBlockClause', function () {
      return $1.addElse($3);
    }),
  ],
  Operation: [
    dispatch('Expression & Expression', function () {
      return new Op('+', $1, $3);
    }),
    dispatch('Expression + Expression', function () {
      return new Op('+', $1, $3);
    }),
    dispatch('Expression - Expression', function () {
      return new Op('-', $1, $3);
    }),
    dispatch('Expression MOD Expression', function () {
      return new Op('%', $1, $3);
    }),
    dispatch('Expression \\ Expression', function () {
      return new Op('/', $1, $3);
    }),
    dispatch('Expression * Expression', function () {
      return new Op('*', $1, $3);
    }),
    dispatch('Expression / Expression', function () {
      return new Op('/', $1, $3);
    }),
    dispatch('Expression ^ Expression', function () {
      return new Op('^', $1, $3);
    }),
    dispatch('Expression COMPARE Expression', function () {
      return new Op($2, $1, $3);
    }),
    dispatch('Expression LOGICAL Expression', function () {
      return new Op($2, $1, $3);
    }),
  ],
};

export default grammar;
