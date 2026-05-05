/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import json from '../package.json' with {type: 'json'};

test('supports static import with type: json attribute', () => {
  expect(json).toHaveProperty('jest.testEnvironment', 'node');
});

test('supports dynamic import with type: json attribute', async () => {
  const {default: dyn} = await import('../package.json', {
    with: {type: 'json'},
  });
  expect(dyn).toHaveProperty('jest.testEnvironment', 'node');
});

test('supports data:application/json with type: json attribute', async () => {
  const dataUri = `data:application/json,${encodeURIComponent(
    JSON.stringify({hello: 'world'}),
  )}`;
  const {default: dyn} = await import(dataUri, {with: {type: 'json'}});
  expect(dyn).toEqual({hello: 'world'});
});
