import { Scope } from '../nodes';
import { VariableType } from './patterns';

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
}

export interface Options {
  scope?: Scope;
  referencedVariables?: string[];
  reserve?: boolean;
  makeReturn?: boolean;
  modifier?: Modifier;
}
