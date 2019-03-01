/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type Global = NodeJS.Global;

import bind from './bind';

const install = (g: Global, ...args: Array<any>) => {
  const test = (title: string, test: Function, timeout?: number) =>
    bind(g.test)(...args)(title, test, timeout);
  test.skip = bind(g.test.skip)(...args);
  test.only = bind(g.test.only)(...args);

  const it = (title: string, test: Function, timeout?: number) =>
    bind(g.it)(...args)(title, test, timeout);
  it.skip = bind(g.it.skip)(...args);
  it.only = bind(g.it.only)(...args);

  const xit = bind(g.xit)(...args);
  const fit = bind(g.fit)(...args);
  const xtest = bind(g.xtest)(...args);

  const describe = (title: string, suite: Function, timeout?: number) =>
    bind(g.describe, false)(...args)(title, suite, timeout);
  describe.skip = bind(g.describe.skip, false)(...args);
  describe.only = bind(g.describe.only, false)(...args);
  const fdescribe = bind(g.fdescribe, false)(...args);
  const xdescribe = bind(g.xdescribe, false)(...args);

  return {describe, fdescribe, fit, it, test, xdescribe, xit, xtest};
};

const each = (...args: Array<any>) => install(global, ...args);

each.withGlobal = (g: Global) => (...args: Array<any>) => install(g, ...args);

export {bind};

export default each;
