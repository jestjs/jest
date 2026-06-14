/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('renders snapshots with an ESM serializer from config', () => {
  expect({
    __serializeWithEsmPlugin: true,
    value: 'serializer',
  }).toMatchSnapshot();
});
