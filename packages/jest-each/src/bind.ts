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
  let multipleLineCommentCount: number = 0;
  let isSingleLineComment: boolean = false;
  let skipNext: boolean = false;

  function removeCommentsFromLine(line: string): string {
    const result = line
      .split('')
      .reduce((acc: Array<string>, character, index, array) => {
        const next = array[index + 1];

        if (skipNext === true) {
          skipNext = false;
          return acc;
        }

        if (isSingleLineComment === true) {
          if (character === '\n') {
            isSingleLineComment = false;
          }

          return acc;
        }

        if (character === '/') {
          // open /*
          if (next === '*') {
            multipleLineCommentCount += 1;
            skipNext = true;
            return acc;
          }

          // single line //
          if (multipleLineCommentCount === 0 && next === '/') {
            isSingleLineComment = true;
            skipNext = true;
            return acc;
          }
        }

        // close */
        if (character === '*') {
          if (next === '/') {
            if (multipleLineCommentCount === 0) {
              throw new SyntaxError('Unexpected token */');
            }

            multipleLineCommentCount -= 1;
            skipNext = true;
            return acc;
          }
        }

        if (multipleLineCommentCount !== 0) {
          return acc;
        }

        if (acc[acc.length - 1] === undefined || character === '\n') {
          acc.push('');
        }

        acc[acc.length - 1] += character;

        return acc;
      }, [])
      .join('');

    return result;
  }

  const result = table
    // remove excess space from all lines
    .map(line =>
      line
        .split('\n')
        .map(subLine => subLine.trim())
        .join('\n'),
    )
    .reduce(
      (
        acc: {headings: Array<string>; data: Global.TemplateData},
        line,
        index,
        array,
      ) => {
        line = removeCommentsFromLine(line);

        const isLastLine = index === array.length - 1;
        if (isLastLine === true && multipleLineCommentCount !== 0) {
          throw new SyntaxError('Unexpected trailing token /*');
        }

        // index 0 will always be the header
        if (index === 0) {
          const headings = getHeadingKeys(line);
          acc.headings = headings;
        }

        // will throw error if headings are missing
        if (acc.headings.length === 0) {
          return acc;
        }

        const isDone = index === data.length;
        if (isDone === true) {
          return acc;
        }

        if (multipleLineCommentCount !== 0 || isSingleLineComment === true) {
          return acc;
        }

        const matchedData = data[index];

        acc.data.push(matchedData);

        return acc;
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
