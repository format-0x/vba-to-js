import { Alternative, Grammar, Modifier, Options } from './types';
import {
  Access,
  Assign,
  Block, BooleanLiteral,
  Break,
  Call,
  Code,
  For,
  IdentifierLiteral,
  If,
  Literal,
  NamedArgument,
  NumberLiteral,
  Op,
  ParamArray,
  Parameter,
  Parens,
  PropertyName,
  Return,
  Root,
  StringLiteral,
  Switch,
  SwitchCase,
  ThisLiteral,
  Type,
  UndefinedLiteral,
  Value,
  VariableDeclaration,
  VariableDeclarationList,
  While,
  With
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
    dispatch('ConstDeclaration'),
    dispatch('Return'),
    dispatch('If'),
    dispatch('PostWhile'),
    dispatch('PreWhile'),
    dispatch('For'),
    dispatch('Wend'),
    dispatch('Break'),
    dispatch('Switch'),
    dispatch('Call'),
    dispatch('With'),
    dispatch('Invocation'),
    dispatch('Code'),
  ],
  Expression: [
    dispatch('Value'),
    dispatch('Operation'),
    dispatch('Assign'),
    dispatch('Parenthetical', function () {
      return new Value($1);
    }),
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
    dispatch('String'),
    dispatch('Number'),
    dispatch('ARG_SKIP', function () {
      return new UndefinedLiteral();
    }),
    dispatch('NOTHING', function () {
      return new UndefinedLiteral();
    }),
    dispatch('BOOLEAN', function () {
      return new BooleanLiteral($1);
    }),
  ],
  Assign: [
    dispatch('Assignable = Expression', function () {
      return new Assign($1, $3);
    }),
    dispatch('SET Assignable = Expression', function () {
      return new Assign($2, $4, { assignType: 'set', context: 'value' });
    }),
    dispatch('SET Assignable = NEW Expression', function () {
      return new Assign($2, $5, { assignType: 'set', context: 'value' });
    }),
    dispatch('LET Assignable = Expression', function () {
      return new Assign($2, $4, { assignType: 'let', context: 'value' });
    }),
  ],
  Params: [
    dispatch('( ParamList )', function () {
      return $2;
    }),
    dispatch('( ParamList , ParamArray )', function () {
      return [...$2, $4];
    }),
    dispatch('( ParamArray )', function () {
      return [$2];
    }),
    dispatch('( PARAM_MODIFIER ParamArray )', function () {
      return [$3.setModifier($2)];
    }),
    dispatch('( ParamList , PARAM_MODIFIER ParamArray )', function () {
      return [...$2, $5.setModifier($4)];
    }),
  ],
  ParamList: [
    dispatch('', function () {
      return [];
    }),
    dispatch('Param', function () {
      return [$1];
    }),
    dispatch('ParamList , Param', function () {
      return [...$1, $3];
    }),
  ],
  Param: [
    dispatch('ParamVariable', function () {
      return $1;
    }),
    dispatch('PARAM_MODIFIER ParamVariable', function () {
      return $2.setModifier($1);
    }),
  ],
  ParamArray: [
    dispatch('PARAM_ARRAY Identifier ( )', function () {
      return new ParamArray($2);
    }),
    dispatch('PARAM_ARRAY Identifier ( ) Type', function () {
      return new ParamArray($2, $5);
    }),
  ],
  ParamVariable: [
    dispatch('Identifier', function () {
      return new Parameter($1);
    }),
    dispatch('Identifier Type', function () {
      return new Parameter($1, $2);
    }),
    dispatch('Identifier Type = Expression', function () {
      return new Parameter($1, $2, $4);
    }),
  ],
  SimpleAssignable: [
    dispatch('Identifier', function () {
      return new Value($1);
    }),
    dispatch('Value Accessor', function () {
      return $1.add($2);
    }),
    dispatch('ParenthesizedInvocation', function () {
      return new Value($1);
    }),
  ],
  Break: [
    dispatch('BREAK', function () {
      return new Break();
    }),
  ],
  Return: [
    dispatch('RETURN', function () {
      return new Return();
    }),
  ],
  Code: [
    dispatch('Sub'),
    dispatch('FUNCTION_MODIFIER Sub', function () {
      return $2.setModifier($1);
    }),
    dispatch('Function'),
    dispatch('FUNCTION_MODIFIER Function', function () {
      return $2.setModifier($1);
    }),
  ],
  Sub: [
    dispatch('SUB_START Identifier Params TERMINATOR Body TERMINATOR SUB_END', function () {
      return new Code($2, $3, Block.wrap([$5]));
    }),
  ],
  Function: [
    dispatch('FUNCTION_START Identifier Params TERMINATOR Body TERMINATOR FUNCTION_END', function () {
      return new Code($2, $3, Block.wrap([$5]));
    }),
    dispatch('FUNCTION_START Identifier Params Type TERMINATOR Body TERMINATOR FUNCTION_END', function () {
      return new Code($2, $3, Block.wrap([$6]), $3);
    }),
  ],
  Assignable: [
    dispatch('SimpleAssignable'),
  ],
  Value: [
    dispatch('Assignable'),
    dispatch('This'),
    dispatch('Literal', function () {
      return new Value($1);
    }),
  ],
  Accessor: [
    dispatch('. Property', function () {
      return new Access($2);
    }),
  ],
  ParenthesizedInvocation: [
    dispatch('Value ParenthesizedArgs', function () {
      return new Call($1, $2);
    }),
  ],
  Invocation: [
    dispatch('Value FirstArg', function () {
      return new Call($1, [$2]);
    }),
    dispatch('Value FirstArg , ArgList', function () {
      return new Call($1, [$2, ...$4]);
    }),
  ],
  Call: [
    dispatch('CALL ParenthesizedInvocation', function () {
      return $2;
    }),
  ],
  ParenthesizedArgs: [
    dispatch('( )', function () {
      return [];
    }),
    dispatch('( ArgList )', function () {
      return [].concat($2);
    }),
  ],
  ArgList: [
    dispatch('Arg', function () {
      return [$1];
    }),
    dispatch('ArgList , Arg', function () {
      return [...$1, $3];
    }),
  ],
  FirstArg: [
    dispatch('Value'),
    dispatch('NamedArg'),
  ],
  Arg: [
    dispatch('Expression'),
    dispatch('NamedArg'),
  ],
  NamedArg: [
    dispatch('Identifier := Expression', function () {
      return new NamedArgument($1, $3);
    }),
  ],
  This: [
    dispatch('THIS', function () {
      return new Value(new ThisLiteral());
    }),
  ],
  Parenthetical: [
    dispatch('( Expression )', function () {
      return new Parens($2);
    }),
  ],
  VariableDeclaration: [
    dispatch('MODIFIER VariableList', function () {
      return new VariableDeclarationList($2, $1);
    }),
    dispatch('DIM VariableList', function () {
      return new VariableDeclarationList($2, $1);
    }),
  ],
  ConstDeclaration: [
    dispatch('CONST ConstList', function () {
      return new VariableDeclarationList($2, <Modifier.Private>'Private');
    }),
    dispatch('MODIFIER CONST ConstList', function () {
      return new VariableDeclarationList($3, $1);
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
  ConstList: [
    dispatch('Const', function () {
      return [$1];
    }),
    dispatch('ConstList , Const', function () {
      return [...$1, $3];
    }),
  ],
  Const: [
    dispatch('Identifier = Expression', function () {
      return new VariableDeclaration($1, new Type('Variant'), $3);
    }),
    dispatch('Identifier Type = Expression', function () {
      return new VariableDeclaration($1, $2, $4);
    }),
  ],
  Variable: [
    dispatch('Identifier', function () {
      return new VariableDeclaration($1);
    }),
    dispatch('Identifier Type', function () {
      return new VariableDeclaration($1, $2);
    }),
    dispatch('Identifier New', function () {
      return new VariableDeclaration($1, $2);
    }),
  ],
  New: [
    dispatch('AS NEW TYPE', function () {
      return new Type($3, { object: true });
    }),
  ],
  Type: [
    dispatch('AS TYPE', function () {
      return new Type($2);
    }),
    dispatch('StringType'),
  ],
  StringType: [
    dispatch('AS STRING_TYPE', function () {
      return new Type($2);
    }),
    dispatch('AS STRING_TYPE * NUMBER', function () {
      return new Type($2, { size: $4 });
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
  With: [
    dispatch('WITH Value TERMINATOR Body TERMINATOR WITH_END', function () {
      return new With($2, $4);
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
      return new Op('**', $1, $3);
    }),
    dispatch('Expression COMPARE Expression', function () {
      return new Op($2, $1, $3);
    }),
    dispatch('Expression LOGICAL Expression', function () {
      return new Op($2, $1, $3);
    }),
    dispatch('UNARY Expression', function () {
      return new Op($1, $2);
    }),
  ],
};

export default grammar;
