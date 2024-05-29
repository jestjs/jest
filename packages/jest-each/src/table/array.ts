/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as util from 'util';
import type {Global} from '@jest/types';
import {format as pretty} from 'pretty-format';
import type {EachTests} from '../bind';
import {type Templates, interpolateVariables} from './interpolation';

const SUPPORTED_PLACEHOLDERS = /%[#Odfijops]/g;
const PRETTY_PLACEHOLDER = '%p';
const INDEX_PLACEHOLDER = '%#';
const NUMBER_PLACEHOLDER = '%$';
const PLACEHOLDER_PREFIX = '%';
const ESCAPED_PLACEHOLDER_PREFIX = /%%/g;
const JEST_EACH_PLACEHOLDER_ESCAPE = '@@__JEST_EACH_PLACEHOLDER_ESCAPE__@@';

export default function array(
  title: string,
  arrayTable: Global.ArrayTable,
): EachTests {
  if (isTemplates(title, arrayTable)) {
    return arrayTable.map((template, index) => ({
      arguments: [template],
      title: interpolateVariables(title, template, index).replaceAll(
        ESCAPED_PLACEHOLDER_PREFIX,
        PLACEHOLDER_PREFIX,
      ),
    }));
  }
  return normaliseTable(arrayTable).map((row, index) => ({
    arguments: row,
    title: formatTitle(title, row, index),
  }));
}

const isTemplates = (
  title: string,
  arrayTable: Global.ArrayTable,
): arrayTable is Templates =>
  !SUPPORTED_PLACEHOLDERS.test(interpolateEscapedPlaceholders(title)) &&
  !isTable(arrayTable) &&
  arrayTable.every(col => col != null && typeof col === 'object');

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
    .reduce<string>(
      (formattedTitle, value) => {
        const [placeholder] = getMatchingPlaceholders(formattedTitle);
        const normalisedValue = normalisePlaceholderValue(value);
        if (!placeholder) return formattedTitle;

        if (placeholder === PRETTY_PLACEHOLDER)
          return interpolatePrettyPlaceholder(formattedTitle, normalisedValue);

        return util.format(formattedTitle, normalisedValue);
      },
      interpolateTitleIndexAndNumber(
        interpolateEscapedPlaceholders(title),
        rowIndex,
      ),
    )
    .replaceAll(
      new RegExp(JEST_EACH_PLACEHOLDER_ESCAPE, 'g'),
      PLACEHOLDER_PREFIX,
    );

const normalisePlaceholderValue = (value: unknown) =>
  typeof value === 'string'
    ? value.replaceAll(
        new RegExp(PLACEHOLDER_PREFIX, 'g'),
        JEST_EACH_PLACEHOLDER_ESCAPE,
      )
    : value;

const getMatchingPlaceholders = (title: string) =>
  title.match(SUPPORTED_PLACEHOLDERS) || [];

const interpolateEscapedPlaceholders = (title: string) =>
  title.replaceAll(ESCAPED_PLACEHOLDER_PREFIX, JEST_EACH_PLACEHOLDER_ESCAPE);

const interpolateTitleIndexAndNumber = (title: string, index: number) =>
  title
    .replace(INDEX_PLACEHOLDER, index.toString())
    .replace(NUMBER_PLACEHOLDER, (index + 1).toString());

const interpolatePrettyPlaceholder = (title: string, value: unknown) =>
  title.replace(PRETTY_PLACEHOLDER, pretty(value, {maxDepth: 1, min: true}));
