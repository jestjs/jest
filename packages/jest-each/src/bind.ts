/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import chalk from 'chalk';
import pretty from 'pretty-format';
import {ErrorWithStack} from 'jest-util';

import convertArrayTable from './table/array';
import convertTemplateTable from './table/template';

const EXPECTED_COLOR = chalk.green;
const RECEIVED_COLOR = chalk.red;

export type EachTable = Array<{
  title: string;
  arguments: Array<unknown>;
}>;

export default (cb: Function, supportsDone: boolean = true) => (...args: any) =>
  function eachBind(title: string, test: Function, timeout?: number): void {
    if (args.length === 1) {
      const [tableArg] = args;

      if (!Array.isArray(tableArg)) {
        const error = new ErrorWithStack(
          '`.each` must be called with an Array or Tagged Template Literal.\n\n' +
            `Instead was called with: ${pretty(tableArg, {
              maxDepth: 1,
              min: true,
            })}\n`,
          eachBind,
        );
        return cb(title, () => {
          throw error;
        });
      }

      if (isTaggedTemplateLiteral(tableArg)) {
        if (isEmptyString(tableArg[0])) {
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

      if (isEmptyTable(tableArg)) {
        const error = new ErrorWithStack(
          'Error: `.each` called with an empty Array of table data.\n',
          eachBind,
        );
        return cb(title, () => {
          throw error;
        });
      }
      return convertArrayTable(title, tableArg).forEach(row =>
        cb(
          row.title,
          applyArguments(supportsDone, row.arguments, test),
          timeout,
        ),
      );
    }

    const templateStrings = args[0];
    const data = args.slice(1);

    const keys = getHeadingKeys(templateStrings[0]);

    const missingData = data.length % keys.length;

    if (missingData > 0) {
      const error = new ErrorWithStack(
        'Not enough arguments supplied for given headings:\n' +
          EXPECTED_COLOR(keys.join(' | ')) +
          '\n\n' +
          'Received:\n' +
          RECEIVED_COLOR(pretty(data)) +
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

    return convertTemplateTable(title, keys, data).forEach(row =>
      cb(row.title, applyArguments(supportsDone, row.arguments, test), timeout),
    );
  };

const isTaggedTemplateLiteral = (array: any) => array.raw !== undefined;
const isEmptyTable = (table: Array<any>) => table.length === 0;
const isEmptyString = (str: string) =>
  typeof str === 'string' && str.trim() === '';

type Done = () => {};

const applyArguments = (
  supportsDone: boolean,
  params: Array<any>,
  test: Function,
) =>
  supportsDone && params.length < test.length
    ? (done: Done) => test(...params, done)
    : () => test(...params);

const getHeadingKeys = (headings: string): Array<string> =>
  headings.replace(/\s/g, '').split('|');

const pluralize = (word: string, count: number) =>
  word + (count === 1 ? '' : 's');
