/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Global} from '@jest/types';
import type {EachTests} from '../bind';
import {
  Headings,
  Template,
  Templates,
  interpolateVariables,
} from './interpolation';

export default function template(
  title: string,
  headings: Headings,
  row: Global.Row,
): EachTests {
  const table = convertRowToTable(row, headings);
  const templates = convertTableToTemplates(table, headings);
  return templates.map((template, index) => ({
    arguments: [template],
    title: interpolateVariables(title, template, index),
  }));
}

const convertRowToTable = (row: Global.Row, headings: Headings): Global.Table =>
  Array.from({length: row.length / headings.length}, (_, index) =>
    row.slice(
      index * headings.length,
      index * headings.length + headings.length,
    ),
  );

const convertTableToTemplates = (
  table: Global.Table,
  headings: Headings,
): Templates =>
  table.map(row =>
    row.reduce<Template>(
      (acc, value, index) => Object.assign(acc, {[headings[index]]: value}),
      {},
    ),
  );
