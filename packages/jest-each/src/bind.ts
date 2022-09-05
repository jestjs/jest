/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Global} from '@jest/types';
import {ErrorWithStack, convertDescriptorToString} from 'jest-util';
import convertArrayTable from './table/array';
import convertTemplateTable from './table/template';
import {
  extractValidTemplateHeadings,
  validateArrayTable,
  validateTemplateTableArguments,
} from './validation';

export type EachTests = ReadonlyArray<{
  title: string;
  arguments: ReadonlyArray<unknown>;
}>;

// type TestFn = (done?: Global.DoneFn) => Promise<any> | void | undefined;
type GlobalCallback = (
  testName: string,
  fn: Global.ConcurrentTestFn,
  timeout?: number,
) => void;

export default function bind<EachCallback extends Global.TestCallback>(
  cb: GlobalCallback,
  supportsDone = true,
) {
  return (
    table: Global.EachTable,
    ...taggedTemplateData: Global.TemplateData
  ) =>
    function eachBind(
      title: Global.BlockNameLike,
      test: Global.EachTestFn<EachCallback>,
      timeout?: number,
    ): void {
      title = convertDescriptorToString(title);
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
      } catch (e: any) {
        const error = new ErrorWithStack(e.message, eachBind);
        return cb(title, () => {
          throw error;
        });
      }
    };
}

const isArrayTable = (data: Global.TemplateData) => data.length === 0;

const buildArrayTests = (title: string, table: Global.EachTable): EachTests => {
  validateArrayTable(table);
  return convertArrayTable(title, table as Global.ArrayTable);
};

const buildTemplateTests = (
  title: string,
  table: Global.EachTable,
  taggedTemplateData: Global.TemplateData,
): EachTests => {
  const headings = getHeadingKeys(table[0] as string);
  validateTemplateTableArguments(headings, taggedTemplateData);
  return convertTemplateTable(title, headings, taggedTemplateData);
};

const getHeadingKeys = (headings: string): Array<string> =>
  extractValidTemplateHeadings(headings).replace(/\s/g, '').split('|');

const applyArguments = <EachCallback extends Global.TestCallback>(
  supportsDone: boolean,
  params: ReadonlyArray<unknown>,
  test: Global.EachTestFn<EachCallback>,
): Global.EachTestFn<any> =>
  supportsDone && params.length < test.length
    ? (done: Global.DoneFn) => test(...params, done)
    : () => test(...params);
