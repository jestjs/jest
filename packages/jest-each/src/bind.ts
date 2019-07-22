/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Global} from '@jest/types';
import {ErrorWithStack} from 'jest-util';

import convertArrayTable from './table/array';
import convertTemplateTable from './table/template';
import {validateArrayTable, validateTemplateTableHeadings} from './validation';

export type EachTests = Array<{
  title: string;
  arguments: Array<unknown>;
}>;

type TestFn = (done?: Global.DoneFn) => Promise<any> | void | undefined;
type GlobalCallback = (testName: string, fn: TestFn, timeout?: number) => void;

export default (cb: GlobalCallback, supportsDone: boolean = true) => (
  table: Global.EachTable,
  ...taggedTemplateData: Global.TemplateData
) =>
  function eachBind(
    title: string,
    test: Global.EachTestFn,
    timeout?: number,
  ): void {
    try {
      const tests = isArrayTable(taggedTemplateData)
        ? buildArrayTests(title, table)
        : buildTemplateTests(title, table, taggedTemplateData);

      return tests.forEach(row =>
        cb(
          row.title,
          applyArguments(supportsDone, row.arguments, test),
          timeout,
        ),
      );
    } catch (e) {
      const error = new ErrorWithStack(e.message, eachBind);
      return cb(title, () => {
        throw error;
      });
    }
  };

const isArrayTable = (data: Global.TemplateData) => data.length === 0;

const buildArrayTests = (title: string, table: Global.EachTable): EachTests => {
  validateArrayTable(table);
  return convertArrayTable(title, table as Global.ArrayTable);
};

function filterTemplate(table: Global.EachTable, data: Global.TemplateData) {
  let sectionCount: number;
  let sectionIndex: number;

  const result = table
    .join('')
    .trimLeft()
    .split('\n')
    .reduce(
      (
        acc: {headings: Array<string>; data: Global.TemplateData},
        line: string,
        index: number,
      ) => {
        line = line.trim();

        const isComment = line.startsWith('//') || line.startsWith('/*');
        if (isComment === true) {
          return acc;
        }

        if (sectionCount === undefined) {
          // remove /**/ comments
          line = line.replace(/\/\*(.*?)\*\//g, '');
          // remove // comments
          line = line.split('//')[0].trim();

          const headings = getHeadingKeys(line);

          sectionCount = headings.length;
          sectionIndex = index;

          return {...acc, headings};
        }

        const lastIndex = (index - sectionIndex) * sectionCount;
        const firstIndex = lastIndex - (sectionCount - 1);
        const matchedData = data.slice(firstIndex - 1, lastIndex);

        return {
          ...acc,
          data: [...acc.data, ...matchedData],
        };
      },
      {data: [], headings: []},
    );

  return result;
}

const buildTemplateTests = (
  title: string,
  table: Global.EachTable,
  taggedTemplateData: Global.TemplateData,
): EachTests => {
  const {data, headings} = filterTemplate(table, taggedTemplateData);
  validateTemplateTableHeadings(headings, data);
  return convertTemplateTable(title, headings, data);
};

const getHeadingKeys = (headings: string): Array<string> =>
  headings
    .replace(/\s/g, '')
    .split('|')
    .filter(heading => !!heading);

const applyArguments = (
  supportsDone: boolean,
  params: Array<unknown>,
  test: Global.EachTestFn,
): Global.EachTestFn =>
  supportsDone && params.length < test.length
    ? (done: Global.DoneFn) => test(...params, done)
    : () => test(...params);
