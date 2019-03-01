/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import pretty from 'pretty-format';
import {isPrimitive} from 'jest-get-type';
import {Global} from '@jest/types';
import {EachTests} from '../bind';

type Template = {[key: string]: unknown};
type Templates = Array<Template>;
type Headings = Array<string>;

export default (
  title: string,
  headings: Headings,
  row: Global.Row,
): EachTests => {
  const table = convertRowToTable(row, headings);
  const templates = convertTableToTemplates(table, headings);
  return templates.map(template => ({
    arguments: [template],
    title: interpolate(title, template),
  }));
};

const convertRowToTable = (row: Global.Row, headings: Headings): Global.Table =>
  Array.from({length: row.length / headings.length}).map((_, index) =>
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

const interpolate = (title: string, template: Template) =>
  Object.keys(template)
    .reduce(getMatchingKeyPaths(title), []) // aka flatMap
    .reduce(replaceKeyPathWithValue(template), title);

const getMatchingKeyPaths = (title: string) => (
  matches: Headings,
  key: string,
) => matches.concat(title.match(new RegExp(`\\$${key}[\\.\\w]*`, 'g')) || []);

const replaceKeyPathWithValue = (template: Template) => (
  title: string,
  match: string,
) => {
  const keyPath = match.replace('$', '').split('.');
  const value = getPath(template, keyPath);

  if (isPrimitive(value)) {
    return title.replace(match, String(value));
  }
  return title.replace(match, pretty(value, {maxDepth: 1, min: true}));
};

const getPath = (
  template: Template | any,
  [head, ...tail]: Array<string>,
): any => {
  if (!head || !template.hasOwnProperty || !template.hasOwnProperty(head))
    return template;
  return getPath(template[head], tail);
};
