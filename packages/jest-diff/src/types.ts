/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type {CompareKeys} from 'pretty-format';

export type DiffOptionsColor = (arg: string) => string; // subset of Chalk type

export type DiffOptions = {
  aAnnotation?: string;
  aColor?: DiffOptionsColor;
  aIndicator?: string;
  bAnnotation?: string;
  bColor?: DiffOptionsColor;
  bIndicator?: string;
  changeColor?: DiffOptionsColor;
  changeLineTrailingSpaceColor?: DiffOptionsColor;
  commonIndicator?: string;
  commonLineTrailingSpaceColor?: DiffOptionsColor;
  contextLines?: number;
  emptyFirstOrLastLinePlaceholder?: string;
  expand?: boolean;
  includeChangeCounts?: boolean;
  noDim?: boolean;
  omitAnnotationLines?: boolean;
  patchColor?: DiffOptionsColor;
  compareKeys?: CompareKeys;
};

export type DiffOptionsNormalized = {
  aAnnotation: string;
  aColor: DiffOptionsColor;
  aIndicator: string;
  bAnnotation: string;
  bColor: DiffOptionsColor;
  bIndicator: string;
  changeColor: DiffOptionsColor;
  changeLineTrailingSpaceColor: DiffOptionsColor;
  commonIndicator: string;
  commonLineTrailingSpaceColor: DiffOptionsColor;
  compareKeys: CompareKeys;
  contextLines: number;
  emptyFirstOrLastLinePlaceholder: string;
  expand: boolean;
  includeChangeCounts: boolean;
  noDim: boolean;
  omitAnnotationLines: boolean;
  patchColor: DiffOptionsColor;
};
