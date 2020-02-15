import { Scope } from '../nodes';

export enum BlockType {
  RootBlock = 'Program',
  ClassBody = 'ClassBody',
  BlockStatement = 'BlockStatement',
}

export interface Options {
  scope?: Scope;
  referencedVariables?: string[];
  reserve?: boolean;
}
