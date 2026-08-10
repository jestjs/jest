/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const greet = require('../greet.hbs');

test('am', () => {
  expect(greet({am: true, name: 'Joe'}).replaceAll('\r\n', '\n')).toBe(
    '<p>Good\n  morning\nJoe!</p>\n',
  );
});
