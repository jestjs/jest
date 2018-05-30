/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import bind from './bind';

type GlobalCallbacks = {
  test(title: string, test: Function): void,
  xtest(title: string, test: Function): void,
  it(title: string, test: Function): void,
  fit(title: string, test: Function): void,
  xit(title: string, test: Function): void,
  describe(title: string, test: Function): void,
  fdescribe(title: string, test: Function): void,
  xdescribe(title: string, test: Function): void,
};

const install = (g: GlobalCallbacks, ...args: Array<mixed>) => {
  const test = (title: string, test: Function) =>
    bind(g.test)(...args)(title, test);
  test.skip = bind(g.test.skip)(...args);
  test.only = bind(g.test.only)(...args);

  const it = (title: string, test: Function) =>
    bind(g.it)(...args)(title, test);
  it.skip = bind(g.it.skip)(...args);
  it.only = bind(g.it.only)(...args);

  const xit = bind(g.xit)(...args);
  const fit = bind(g.fit)(...args);
  const xtest = bind(g.xtest)(...args);

  const describe = (title: string, suite: Function) =>
    bind(g.describe)(...args)(title, suite);
  describe.skip = bind(g.describe.skip)(...args);
  describe.only = bind(g.describe.only)(...args);
  const fdescribe = bind(g.fdescribe)(...args);
  const xdescribe = bind(g.xdescribe)(...args);

  return {describe, fdescribe, fit, it, test, xdescribe, xit, xtest};
};

const each = (...args: Array<mixed>) => install(global, ...args);

each.withGlobal = (g: GlobalCallbacks) => (...args: Array<mixed>) =>
  install(g, ...args);

export {bind};

export default each;
