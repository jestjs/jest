/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {jest as jestObject} from '@jest/globals';

afterEach(() => {
  jestObject.resetModules();
});

test('can mock module', async () => {
  jestObject.unstable_mockModule('../mockedModule.mjs', () => ({foo: 'bar'}), {
    virtual: true,
  });

  const importedMock = await import('../mockedModule.mjs');

  expect(Object.keys(importedMock)).toEqual(['foo']);
  expect(importedMock.foo).toBe('bar');
});

test('can mock transitive module', async () => {
  jestObject.unstable_mockModule('../index.js', () => ({foo: 'bar'}));

  const importedMock = await import('../reexport.js');

  expect(Object.keys(importedMock)).toEqual(['foo']);
  expect(importedMock.foo).toBe('bar');
});

test('can unmock module', async () => {
  jestObject.unstable_mockModule('../index.js', () => ({
    double: () => 1000,
  }));

  const importedMock = await import('../index.js');
  expect(importedMock.double()).toBe(1000);

  jestObject.unstable_unmockModule('../index.js');

  const importedMockAfterUnmock = await import('../index.js');
  expect(importedMockAfterUnmock.double(2)).toBe(4);
});
