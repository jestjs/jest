/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {DoneFn, ItBase} from '@jest/types/build/Global';
import chalk from 'chalk';
import pretty from 'pretty-format';
import {ErrorWithStack} from 'jest-util';

import convertArrayTable from './table/array';
import convertTemplateTable from './table/template';

const EXPECTED_COLOR = chalk.green;
const RECEIVED_COLOR = chalk.red;

type EachTestFn = (...args: any[]) => Promise<any> | void | undefined;

// TODO: re-use these everywhere
type Col = unknown;
type Row = Array<Col>;
type Table = Array<Row>;
type ArrayTable = Table | Row;
type TemplateTable = TemplateStringsArray;

export type TemplateData = Array<unknown>;
export type EachTable = ArrayTable | TemplateTable;
// type Each = (table: EachTable, ...rest: Array<unknown>) => JestFunction;
// type Bind = (cb: JestFunction) => Each;

export type EachTests = Array<{
  title: string;
  arguments: Array<unknown>;
}>;

// TODO: update cb to ItBase | DescribeBase and deprecate supportsDone
export default (cb: ItBase, supportsDone: boolean = true) => (
  table: EachTable,
  ...taggedTemplateData: TemplateData
) =>
  function eachBind(title: string, test: EachTestFn, timeout?: number): void {
    if (taggedTemplateData.length === 0) {
      if (!Array.isArray(table)) {
        // TODO: extract validation
        const error = new ErrorWithStack(
          '`.each` must be called with an Array or Tagged Template Literal.\n\n' +
            `Instead was called with: ${pretty(table, {
              maxDepth: 1,
              min: true,
            })}\n`,
          eachBind,
        );
        return cb(title, () => {
          throw error;
        });
      }

      if (isTaggedTemplateLiteral(table)) {
        if (isEmptyString(table[0])) {
          const error = new ErrorWithStack(
            'Error: `.each` called with an empty Tagged Template Literal of table data.\n',
            eachBind,
          );
          return cb(title, () => {
            throw error;
          });
        }

        const error = new ErrorWithStack(
          'Error: `.each` called with a Tagged Template Literal with no data, remember to interpolate with ${expression} syntax.\n',
          eachBind,
        );
        return cb(title, () => {
          throw error;
        });
      }

      if (isEmptyTable(table)) {
        const error = new ErrorWithStack(
          'Error: `.each` called with an empty Array of table data.\n',
          eachBind,
        );
        return cb(title, () => {
          throw error;
        });
      }
      return convertArrayTable(title, table).forEach(row =>
        cb(
          row.title,
          applyArguments(supportsDone, row.arguments, test),
          timeout,
        ),
      );
    }

    const keys = getHeadingKeys(table[0] as string);

    const missingData = taggedTemplateData.length % keys.length;

    if (missingData > 0) {
      const error = new ErrorWithStack(
        'Not enough arguments supplied for given headings:\n' +
          EXPECTED_COLOR(keys.join(' | ')) +
          '\n\n' +
          'Received:\n' +
          RECEIVED_COLOR(pretty(taggedTemplateData)) +
          '\n\n' +
          `Missing ${RECEIVED_COLOR(missingData.toString())} ${pluralize(
            'argument',
            missingData,
          )}`,
        eachBind,
      );

      return cb(title, () => {
        throw error;
      });
    }

    return convertTemplateTable(title, keys, taggedTemplateData).forEach(row =>
      cb(row.title, applyArguments(supportsDone, row.arguments, test), timeout),
    );
  };

const isTaggedTemplateLiteral = (array: any) => array.raw !== undefined;
const isEmptyTable = (table: Array<any>) => table.length === 0;
const isEmptyString = (str: string | unknown) =>
  typeof str === 'string' && str.trim() === '';

const applyArguments = (
  supportsDone: boolean,
  params: Array<unknown>,
  test: EachTestFn,
): EachTestFn =>
  supportsDone && params.length < test.length
    ? (done: DoneFn) => test(...params, done)
    : () => test(...params);

const getHeadingKeys = (headings: string): Array<string> =>
  headings.replace(/\s/g, '').split('|');

const pluralize = (word: string, count: number) =>
  word + (count === 1 ? '' : 's');
