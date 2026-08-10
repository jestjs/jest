/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

const fs = require('fs');

fs.writeFileSync = jest.fn();

test('snapshot', () => {
  const thing = {foo: 'bar'};

  expect(thing).toMatchSnapshot();
});
