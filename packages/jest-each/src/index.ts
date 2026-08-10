/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Global} from '@jest/types';
import bind from './bind';

type Global = Global.Global;
const install = (
  g: Global,
  table: Global.EachTable,
  ...data: Global.TemplateData
) => {
  const bindingWithArray = data.length === 0;
  const bindingWithTemplate = Array.isArray(table) && !!(table as any).raw;
  if (!bindingWithArray && !bindingWithTemplate) {
    throw new Error(
      '`.each` must only be called with an Array or Tagged Template Literal.',
    );
  }
  const test = (
    title: string,
    test: Global.EachTestFn<Global.TestFn>,
    timeout?: number,
  ) => bind(g.test)(table, ...data)(title, test, timeout);
  test.skip = bind(g.test.skip)(table, ...data);
  test.only = bind(g.test.only)(table, ...data);

  const testConcurrent = (
    title: string,
    test: Global.EachTestFn<Global.TestFn>,
    timeout?: number,
  ) => bind(g.test.concurrent)(table, ...data)(title, test, timeout);

  test.concurrent = testConcurrent;
  testConcurrent.only = bind(g.test.concurrent.only)(table, ...data);
  testConcurrent.skip = bind(g.test.concurrent.skip)(table, ...data);

  const it = (
    title: string,
    test: Global.EachTestFn<Global.TestFn>,
    timeout?: number,
  ) => bind(g.it)(table, ...data)(title, test, timeout);
  it.skip = bind(g.it.skip)(table, ...data);
  it.only = bind(g.it.only)(table, ...data);
  it.concurrent = testConcurrent;

  const xit = bind(g.xit)(table, ...data);
  const fit = bind(g.fit)(table, ...data);
  const xtest = bind(g.xtest)(table, ...data);

  const describe = (
    title: string,
    suite: Global.EachTestFn<Global.BlockFn>,
    timeout?: number,
  ) => bind(g.describe, false)(table, ...data)(title, suite, timeout);
  describe.skip = bind(g.describe.skip, false)(table, ...data);
  describe.only = bind(g.describe.only, false)(table, ...data);
  const fdescribe = bind(g.fdescribe, false)(table, ...data);
  const xdescribe = bind(g.xdescribe, false)(table, ...data);

  return {describe, fdescribe, fit, it, test, xdescribe, xit, xtest};
};

const each = (
  table: Global.EachTable,
  ...data: Global.TemplateData
): ReturnType<typeof install> =>
  install(globalThis as unknown as Global, table, ...data);

each.withGlobal =
  (g: Global) =>
  (table: Global.EachTable, ...data: Global.TemplateData) =>
    install(g, table, ...data);

export {bind};

export default each;
