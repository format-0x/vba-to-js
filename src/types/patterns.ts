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
}

export type VariableType = keyof typeof TYPES;
export type VariableKind = keyof typeof Kind;

export interface Variable {
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

