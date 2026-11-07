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

test.each([false, true])(
  'concurrent imports share a mock instance (async factory: %s)',
  async asyncFactory => {
    const factory = jestObject.fn(() => {
      const exports = {token: {}};
      return asyncFactory ? Promise.resolve(exports) : exports;
    });
    jestObject.unstable_mockModule('../mockedModule.mjs', factory, {
      virtual: true,
    });

    const [first, second] = await Promise.all([
      import('../mockedModule.mjs'),
      import('../mockedModule.mjs'),
    ]);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(first.token).toBe(second.token);
    expect(await import('../mockedModule.mjs')).toBe(first);
  },
);

test('can statically import a virtual mocked module', async () => {
  jestObject.unstable_mockModule('../mockedModule.mjs', () => ({foo: 'bar'}), {
    virtual: true,
  });

  const importedMock = await import('../virtualMockReexport.mjs');

  expect(importedMock.foo).toBe('bar');
});

test('can mock transitive module', async () => {
  jestObject.unstable_mockModule('../index.js', () => ({foo: 'bar'}));

  const importedMock = await import('../reexport.js');

  expect(Object.keys(importedMock)).toEqual(['foo']);
  expect(importedMock.foo).toBe('bar');
});

test('can mock transitive builtin module', async () => {
  jestObject.unstable_mockModule('node:fs', () => ({foo: 'bar'}));

  const importedMock = await import('../fsReexport.js');

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
