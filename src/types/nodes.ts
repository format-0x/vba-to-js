import { Scope } from '../nodes';

export enum BlockType {
  RootBlock = 'Program',
  ClassBody = 'ClassBody',
  BlockStatement = 'BlockStatement',
}

export interface ValueParams {}

export enum Modifier {
  Dim = 'DIM',
  Static = 'STATIC',
  Private = 'PRIVATE',
  Public = 'PUBLIC',
  Friend = 'FRIEND',
}

export enum ParamModifier {
  ByVal = 'BY_VAL',
  ByRef = 'BY_REF',
  Optional = 'OPTIONAL',
  ParamArray = 'PARAM_ARRAY',
}

export interface Options {
  scope?: Scope;
  referencedVariables?: string[];
  reserve?: boolean;
  makeReturn?: boolean;
  modifier?: Modifier;
}

export type OptionsWithScope = Required<Pick<Options, 'scope'>>;
