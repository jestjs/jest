/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as util from 'node:util';
import type {Global} from '@jest/types';
import {format as pretty} from 'pretty-format';
import type {EachTests} from '../bind';
import {type Templates, interpolateVariables} from './interpolation';

const SUPPORTED_PLACEHOLDERS = /%[#Odfijops]/;
const VALUE_PLACEHOLDER = /%[Odfijops]/;
const PRETTY_PLACEHOLDER = '%p';
const JSON_PLACEHOLDER = '%j';
const INDEX_PLACEHOLDER = '%#';
const NUMBER_PLACEHOLDER = '%$';
const PLACEHOLDER_PREFIX = '%';
const ESCAPED_PLACEHOLDER_PREFIX = '%%';
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
        const [placeholder] = VALUE_PLACEHOLDER.exec(formattedTitle) || [];
        if (!placeholder) return formattedTitle;

        // A `%` in the printed value is not a placeholder for the next value.
        const printedValue = printValue(placeholder, value).replaceAll(
          PLACEHOLDER_PREFIX,
          JEST_EACH_PLACEHOLDER_ESCAPE,
        );
        return formattedTitle.replace(placeholder, () => printedValue);
      },
      interpolateTitleIndexAndNumber(
        interpolateEscapedPlaceholders(title),
        rowIndex,
      ),
    )
    .replaceAll(JEST_EACH_PLACEHOLDER_ESCAPE, PLACEHOLDER_PREFIX);

const printValue = (placeholder: string, value: unknown): string => {
  if (placeholder === PRETTY_PLACEHOLDER)
    return pretty(value, {maxDepth: 1, min: true});

  if (placeholder === JSON_PLACEHOLDER) return stringifyJson(value);

  return util.format(placeholder, value);
};

const interpolateEscapedPlaceholders = (title: string) =>
  title.replaceAll(ESCAPED_PLACEHOLDER_PREFIX, JEST_EACH_PLACEHOLDER_ESCAPE);

const interpolateTitleIndexAndNumber = (title: string, index: number) =>
  title
    .replace(INDEX_PLACEHOLDER, index.toString())
    .replace(NUMBER_PLACEHOLDER, (index + 1).toString());

// `util.format('%j', …)` throws on a `bigint`, so serialize here instead and
// render bigints the way a JavaScript literal reads. Cyclic values keep the
// `[Circular]` output `util.format` gives them.
function stringifyJson(value: unknown): string {
  if (isCyclic(value)) {
    return '[Circular]';
  }
  return `${JSON.stringify(value, (_, entry) =>
    typeof entry === 'bigint' ? `${entry}n` : entry,
  )}`;
}

function isCyclic(value: unknown, ancestors: Array<unknown> = []): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  if (ancestors.includes(value)) {
    return true;
  }
  const nested = [...ancestors, value];
  return Object.values(value).some(entry => isCyclic(entry, nested));
}
