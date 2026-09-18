/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('uses the first matching serializer', () => {
  expect({kind: 'both', value: 'value'}).toMatchSnapshot();
});

test('loads every configured serializer', () => {
  expect({kind: 'second', value: 'value'}).toMatchSnapshot();
});
