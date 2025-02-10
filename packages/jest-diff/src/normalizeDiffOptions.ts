/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pc from 'picocolors';
import type {CompareKeys} from 'pretty-format';
import type {DiffOptions, DiffOptionsNormalized} from './types';

export const noColor = (string: string): string => string;

const DIFF_CONTEXT_DEFAULT = 5;

const OPTIONS_DEFAULT: DiffOptionsNormalized = {
  aAnnotation: 'Expected',
  aColor: pc.green,
  aIndicator: '-',
  bAnnotation: 'Received',
  bColor: pc.red,
  bIndicator: '+',
  changeColor: pc.inverse,
  changeLineTrailingSpaceColor: noColor,
  commonColor: pc.dim,
  commonIndicator: ' ',
  commonLineTrailingSpaceColor: noColor,
  compareKeys: undefined,
  contextLines: DIFF_CONTEXT_DEFAULT,
  emptyFirstOrLastLinePlaceholder: '',
  expand: true,
  includeChangeCounts: false,
  omitAnnotationLines: false,
  patchColor: pc.yellow,
};

const getCompareKeys = (compareKeys?: CompareKeys): CompareKeys =>
  compareKeys && typeof compareKeys === 'function'
    ? compareKeys
    : OPTIONS_DEFAULT.compareKeys;

const getContextLines = (contextLines?: number): number =>
  typeof contextLines === 'number' &&
  Number.isSafeInteger(contextLines) &&
  contextLines >= 0
    ? contextLines
    : DIFF_CONTEXT_DEFAULT;

// Pure function returns options with all properties.
export const normalizeDiffOptions = (
  options: DiffOptions = {},
): DiffOptionsNormalized => ({
  ...OPTIONS_DEFAULT,
  ...options,
  compareKeys: getCompareKeys(options.compareKeys),
  contextLines: getContextLines(options.contextLines),
});
