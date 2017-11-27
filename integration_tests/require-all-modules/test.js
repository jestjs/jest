/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

it('requires all native modules to check they all work', () => {
  const modules = Object.keys(process.binding('natives')).filter(module =>
    /^[^_][^\/]*$/.test(module)
  );

  // Node 6 has 34 native modules; so the total value has to be >= than 34.
  expect(modules.length).not.toBeLessThan(34);

  // Require all modules to verify they don't throw.
  modules.forEach(module => require(module));
});
