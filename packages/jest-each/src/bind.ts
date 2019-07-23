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
      const tests = isArrayTable(taggedTemplateData, table)
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

const isArrayTable = (
  data: Global.TemplateData,
  _table: Global.EachTable,
): _table is Global.ArrayTable => data.length === 0;

const buildArrayTests = (title: string, table: Global.EachTable): EachTests => {
  validateArrayTable(table);
  return convertArrayTable(title, table as Global.ArrayTable);
};

function filterTemplate(
  table: Global.TemplateTable,
  data: Global.TemplateData,
) {
  let insideSection: boolean = false;
  let currentData: number = 0;
  let sectionCount: number;

  // @ts-ignore
  const result = table.reduce(
    (
      acc: {headings: Array<string>; data: Global.TemplateData},
      line,
      index,
      array,
    ) => {
      line = line.replace(/ /g, '');

      if (index === 0) {
        // get actual header
        const header = line.split('\n').find((subLine: string) => {
          if (!subLine) {
            return false;
          }

          const isComment =
            subLine.startsWith('//') || subLine.startsWith('/*');

          return isComment === false;
        });

        // header not found
        if (!header) {
          return acc;
        }

        // replace end comments
        line = header
          // remove /**/ comments
          .replace(/\/\*(.*?)\*\//g, '')
          // remove // comments
          .split('//')[0];

        const headings = getHeadingKeys(line);
        sectionCount = headings.length;

        return {...acc, headings};
      }

      if (acc.headings.length === 0) {
        return acc;
      }

      const previousLine = array[index - 1].replace(/ /g, '');
      const previouslyInside = sectionCount === 1 ? false : insideSection;
      insideSection =
        line === '|' ||
        // handle single heading
        sectionCount === 1;

      if (
        insideSection === false ||
        // already added data from current section
        (previouslyInside === true && insideSection === true)
      ) {
        return acc;
      }

      const previousLineSplit = previousLine.split('\n');
      const lastNewLine = previousLineSplit[
        previousLineSplit.length - 1
      ].replace(/\/\*(.*?)\*\//g, '');

      const isComment =
        lastNewLine.startsWith('//') || lastNewLine.startsWith('/*');

      if (isComment === true) {
        currentData += sectionCount;
        return acc;
      }

      const firstIndex = currentData;
      const lastIndex = firstIndex + sectionCount;
      const matchedData = data.slice(firstIndex, lastIndex) || [];

      currentData += sectionCount;

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
  table: Global.TemplateTable,
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
