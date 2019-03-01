/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {TestFn, EachTable, TemplateData} from '@jest/types/build/Global';
import bind from './bind';

type Global = NodeJS.Global;

const install = (g: Global, table: EachTable, ...data: TemplateData) => {
  const test = (title: string, test: TestFn, timeout?: number) =>
    bind(g.test)(table, ...data)(title, test, timeout);
  test.skip = bind(g.test.skip)(table, ...data);
  test.only = bind(g.test.only)(table, ...data);

  const it = (title: string, test: TestFn, timeout?: number) =>
    bind(g.it)(table, ...data)(title, test, timeout);
  it.skip = bind(g.it.skip)(table, ...data);
  it.only = bind(g.it.only)(table, ...data);

  const xit = bind(g.xit)(table, ...data);
  const fit = bind(g.fit)(table, ...data);
  const xtest = bind(g.xtest)(table, ...data);

  const describe = (title: string, suite: TestFn, timeout?: number) =>
    bind(g.describe, false)(table, ...data)(title, suite, timeout);
  describe.skip = bind(g.describe.skip, false)(table, ...data);
  describe.only = bind(g.describe.only, false)(table, ...data);
  const fdescribe = bind(g.fdescribe, false)(table, ...data);
  const xdescribe = bind(g.xdescribe, false)(table, ...data);

  return {describe, fdescribe, fit, it, test, xdescribe, xit, xtest};
};

const each = (table: EachTable, ...data: TemplateData) =>
  install(global, table, ...data);

each.withGlobal = (g: Global) => (table: EachTable, ...data: TemplateData) =>
  install(g, table, ...data);

export {bind};

export default each;
