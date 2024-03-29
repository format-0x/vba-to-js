import { Options } from './nodes';
import { IdentifierLiteral } from '../nodes';

export enum TYPES {
  Boolean,
  Byte,
  Currency,
  Date,
  Double,
  Integer,
  Long,
  Object,
  Single,
  String,
  Variant,
}

export enum Kind {
  Parameter,
  Variable,
  Function,
}

export enum ShorthandTypes {
  '%' = 'Integer',
  '&' = 'Long',
  '#' = 'Double',
  '$' = 'String',
  '!' = 'Single',
  '@' = 'Currency',
}

export type VariableType = keyof typeof TYPES;
export type VariableKind = keyof typeof Kind;

export interface VariableParams {
  name: string;
  type: VariableType;
  kind: VariableKind;
  value: any;
  assigned: boolean;
}

export interface VariablePosition {
  [key: string]: number;
}

export enum JS_FORBIDDEN {
  CONST,
}

export type Alternative = [string, string, Options];

export type Grammar = {
  [key: string]: Alternative[],
};
