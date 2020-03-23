/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as util from 'util';
import pretty = require('pretty-format');

import type {Global} from '@jest/types';
import type {EachTests} from '../bind';

const SUPPORTED_PLACEHOLDERS = /%[sdifjoOp%]/g;
const PRETTY_PLACEHOLDER = '%p';
const INDEX_PLACEHOLDER = '%#';
const PLACEHOLDER_PREFIX = '%';
const JEST_EACH_PLACEHOLDER_ESCAPE = '@@__JEST_EACH_PLACEHOLDER_ESCAPE__@@';

export default (title: string, arrayTable: Global.ArrayTable): EachTests =>
  normaliseTable(arrayTable).map((row, index) => ({
    arguments: row,
    title: formatTitle(title, row, index),
  }));

const normaliseTable = (table: Global.ArrayTable): Global.Table =>
  isTable(table) ? table : table.map(colToRow);

const isTable = (table: Global.ArrayTable): table is Global.Table =>
  table.every(Array.isArray);

const colToRow = (col: Global.Col): Global.Row => [col];

const formatTitle = (
  title: string,
  row: Global.Row,
  rowIndex: number,
): string =>
  row
    .reduce<string>((formattedTitle, value) => {
      const [placeholder] = getMatchingPlaceholders(formattedTitle);
      const normalisedValue = normalisePlaceholderValue(value);
      if (!placeholder) return formattedTitle;

      if (placeholder === PRETTY_PLACEHOLDER)
        return interpolatePrettyPlaceholder(formattedTitle, normalisedValue);

      return util.format(formattedTitle, normalisedValue);
    }, interpolateTitleIndex(title, rowIndex))
    .replace(new RegExp(JEST_EACH_PLACEHOLDER_ESCAPE, 'g'), PLACEHOLDER_PREFIX);

const normalisePlaceholderValue = (value: unknown) =>
  typeof value === 'string' && SUPPORTED_PLACEHOLDERS.test(value)
    ? value.replace(PLACEHOLDER_PREFIX, JEST_EACH_PLACEHOLDER_ESCAPE)
    : value;

const getMatchingPlaceholders = (title: string) =>
  title.match(SUPPORTED_PLACEHOLDERS) || [];

const interpolateTitleIndex = (title: string, index: number) =>
  title.replace(INDEX_PLACEHOLDER, index.toString());

const interpolatePrettyPlaceholder = (title: string, value: unknown) =>
  title.replace(PRETTY_PLACEHOLDER, pretty(value, {maxDepth: 1, min: true}));
