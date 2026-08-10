/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

it('should surface pnp errors', () => {
  expect(() => {
    require('undeclared');
  }).toThrow(
    "undeclared tried to access unesitent_module__, but it isn't declared in its dependencies; this makes the require call ambiguous and unsound.",
  );
});
