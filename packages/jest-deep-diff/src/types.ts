/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NewPlugin} from 'pretty-format/src/types';

// options
export type DeepDiffOptions = Omit<FormatOptions, 'plugins'> & {
  plugins?: Array<Plugin>;
};

export type FormatOptions = Partial<FormatOptionsNormalized>;

export type DiffOptionsColor = (arg: string) => string; // subset of Chalk type

export type FormatOptionsNormalized = {
  aAnnotation: string;
  aColor: DiffOptionsColor;
  aIndicator: string;
  bAnnotation: string;
  bColor: DiffOptionsColor;
  bIndicator: string;
  changeColor: DiffOptionsColor;
  changeLineTrailingSpaceColor: DiffOptionsColor;
  commonColor: DiffOptionsColor;
  commonIndicator: string;
  commonLineTrailingSpaceColor: DiffOptionsColor;
  contextLines: number;
  emptyFirstOrLastLinePlaceholder: string;
  expand: boolean;
  includeChangeCounts: boolean;
  omitAnnotationLines: boolean;
  patchColor: DiffOptionsColor;
  serialize: (val: unknown) => string;
  plugins: Array<FormatPlugin>;
};

// plugins
export interface Plugin {
  serialize: Serialize;
  test: PluginTest;
  diff: CustomDiff;
  format: CustomFormat;
}

export type PluginTest = (a: unknown) => boolean;

export interface FormatPlugin {
  test: PluginTest;
  format: CustomFormat;
}

export interface DiffPlugin {
  test: PluginTest;
  diff: CustomDiff;
}

type Serialize = NewPlugin['serialize'];
export interface SerializePlugin {
  test: PluginTest;
  serialize: Serialize;
}

// DiffObject
export type Path = unknown;

export enum Kind {
  EQUAL,
  UPDATED,
  INSERTED,
  DELETED,
  UNEQUAL_TYPE,
}
export interface DiffObject<T1 = unknown, T2 = T1> {
  kind: Kind;
  path?: Path;
  a: T1;
  b: T2;
  childDiffs?: Array<DiffObject>;
}

export type Memos = {
  a: Map<unknown, number>;
  b: Map<unknown, number>;
  position: number;
};

export type DiffFunc<T1 = unknown, T2 = T1> = (
  a: T1,
  b: T2,
  path: Path | undefined,
  memos?: Memos,
) => DiffObject<T1, T2>;

export type CustomDiff = (
  a: unknown,
  b: unknown,
  path: Path | undefined,
  memos: Memos | undefined,
  diff: DiffFunc,
) => DiffObject<unknown, unknown>;

// format

export type LineGenerationOptions = {
  plugins: Array<FormatPlugin>;
};

export type Format<T1 = unknown, T2 = T1> = (
  diff: DiffObject<T1, T2>,
  context: Context,
  options: LineGenerationOptions,
) => Array<Line>;

export type FormatComplexDiff<T1 = unknown, T2 = T1> = (
  diff: DiffObject<T1, T2>,
  context: Context,
  options: LineGenerationOptions,
  format: Format,
) => Array<Line>;

export type CustomFormat = FormatComplexDiff<unknown, unknown>;

export enum LineType {
  COMMON,
  INSERTED,
  DELETED,
}

export interface Context {
  indent?: string;
  prefix?: string;
  sufix?: string;
  skipSerialize?: boolean;
}

export interface Line {
  type: LineType;
  prefix: string;
  val: unknown;
  suffix: string;
  indent: string;
  skipSerialize?: boolean;
}
