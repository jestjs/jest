/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import json from '../package.json' assert {type: 'json'};

test('supports static import', () => {
  expect(json).toHaveProperty('jest.testEnvironment', 'node');
});

test('supports dynamic import', async () => {
  const {default: json} = await import('../package.json', {
    assert: {type: 'json'},
  });
  expect(json).toHaveProperty('jest.testEnvironment', 'node');
});

test('supports data:application/json with type: json assertion', async () => {
  const dataUri = `data:application/json,${encodeURIComponent(
    JSON.stringify({hello: 'world'}),
  )}`;
  const {default: dyn} = await import(dataUri, {assert: {type: 'json'}});
  expect(dyn).toEqual({hello: 'world'});
});
