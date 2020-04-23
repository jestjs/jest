/*
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const greet = require('../greet.hbs');

test('am', () => {
  expect(greet({am: true, name: 'Joe'})).toEqual(
    '<p>Good\n  morning\nJoe!</p>\n',
  );
});
