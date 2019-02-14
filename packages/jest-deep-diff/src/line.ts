import {Context, Line, LineType} from './types';

export const createCommonLine = (val: unknown, context: Context): Line => ({
  indent: context.indent || '',
  prefix: context.prefix || '',
  skipSerialize: !!context.skipSerialize,
  suffix: context.sufix || '',
  type: LineType.COMMON,
  val,
});

export const createInsertedLine = (val: unknown, context: Context): Line => ({
  indent: context.indent || '',
  prefix: context.prefix || '',
  skipSerialize: !!context.skipSerialize,
  suffix: context.sufix || '',
  type: LineType.INSERTED,
  val,
});

export const createDeletedLine = (val: unknown, context: Context): Line => ({
  indent: context.indent || '',
  prefix: context.prefix || '',
  skipSerialize: !!context.skipSerialize,
  suffix: context.sufix || '',
  type: LineType.DELETED,
  val,
});

export const formatUpdated = (
  valA: unknown,
  valB: unknown,
  context: Context,
): Array<Line> => [
  createDeletedLine(valA, context),
  createInsertedLine(valB, context),
];
