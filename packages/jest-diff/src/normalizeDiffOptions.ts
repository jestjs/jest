/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {CompareKeys} from 'pretty-format';
import type {DiffOptions, DiffOptionsNormalized} from './types';

export const noColor = (string: string): string => string;
export const DIM_COLOR = chalk.dim;

const DIFF_CONTEXT_DEFAULT = 5;

const OPTIONS_DEFAULT: DiffOptionsNormalized = {
  aAnnotation: 'Expected',
  aColor: chalk.green,
  aIndicator: '-',
  bAnnotation: 'Received',
  bColor: chalk.red,
  bIndicator: '+',
  changeColor: chalk.inverse,
  changeLineTrailingSpaceColor: noColor,
  commonIndicator: ' ',
  commonLineTrailingSpaceColor: noColor,
  compareKeys: undefined,
  contextLines: DIFF_CONTEXT_DEFAULT,
  emptyFirstOrLastLinePlaceholder: '',
  expand: true,
  includeChangeCounts: false,
  noDim: false,
  omitAnnotationLines: false,
  patchColor: chalk.yellow,
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
