/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import dns from 'dns';
// the point here is that it's the node core module
// eslint-disable-next-line no-restricted-imports
import {readFileSync} from 'fs';
import {createRequire} from 'module';
import prefixDns from 'node:dns';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';
import {jest as jestObject} from '@jest/globals';
import staticImportedStatefulFromCjs from '../fromCjs.mjs';
import {double} from '../index';
import defaultFromCjs, {half, namedFunction} from '../namedExport.cjs';
import {bag} from '../namespaceExport.js';
/* eslint-disable import/no-duplicates */
import staticImportedStateful from '../stateful.mjs';
import staticImportedStatefulWithQuery from '../stateful.mjs?query=1';
import staticImportedStatefulWithAnotherQuery from '../stateful.mjs?query=2';
/* eslint-enable */

test('should have correct import.meta', () => {
  expect(typeof require).toBe('undefined');
  expect(typeof jest).toBe('undefined');
  expect(import.meta).toEqual({
    dirname: expect.any(String),
    filename: expect.any(String),
    jest: expect.anything(),
    resolve: expect.any(Function),
    url: expect.any(String),
  });
  expect(import.meta.jest).toBe(jestObject);
  expect(
    import.meta.url.endsWith('/e2e/native-esm/__tests__/native-esm.test.js'),
  ).toBe(true);
  if (process.platform === 'win32') {
    expect(
      import.meta.filename.endsWith(
        '\\e2e\\native-esm\\__tests__\\native-esm.test.js',
      ),
    ).toBe(true);
    expect(import.meta.dirname.endsWith('\\e2e\\native-esm\\__tests__')).toBe(
      true,
    );
  } else {
    expect(
      import.meta.filename.endsWith(
        '/e2e/native-esm/__tests__/native-esm.test.js',
      ),
    ).toBe(true);
    expect(import.meta.dirname.endsWith('/e2e/native-esm/__tests__')).toBe(
      true,
    );
  }
  expect(
    import.meta
      .resolve('colors')
      .endsWith('jest/e2e/native-esm/node_modules/colors/lib/index.js'),
  ).toBe(true);
  expect(
    import.meta
      .resolve('./native-esm.test')
      .endsWith('jest/e2e/native-esm/__tests__/native-esm.test.js'),
  ).toBe(true);
});

test('should double stuff', () => {
  expect(double(1)).toBe(2);
});

test('should support importing node core modules', () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  const packageJsonPath = resolve(dir, '../package.json');

  expect(JSON.parse(readFileSync(packageJsonPath, 'utf8'))).toEqual({
    devDependencies: {
      colors: '^1.4.0',
      'discord.js': '14.3.0',
      'iso-constants': '^0.1.2',
      yargs: '^17.5.1',
    },
    jest: {
      testEnvironment: 'node',
      transform: {},
    },
    optionalDependencies: {
      'isolated-vm': '^4.6.0',
    },
    type: 'module',
  });
});

test('should support importing node core modules dynamically', async () => {
  // it's important that this module has _not_ been imported at the top level
  const assert = await import('assert');

  expect(typeof assert.strictEqual).toBe('function');
});

test('dynamic import should work', async () => {
  const {double: importedDouble} = await import('../index');

  expect(importedDouble).toBe(double);
  expect(importedDouble(1)).toBe(2);
});

test('import cjs', async () => {
  const {default: half} = await import('../commonjs.cjs');

  expect(half(4)).toBe(2);
});

test('import esm from cjs', async () => {
  const {default: halfPromise} = await import('../fromEsm.cjs');
  expect(await halfPromise(1)).toBe(2);
});

test('require(cjs) and import(cjs) should share caches', async () => {
  const require = createRequire(import.meta.url);

  const {default: importedStateful} = await import('../stateful.cjs');
  const requiredStateful = require('../stateful.cjs');

  expect(importedStateful()).toBe(1);
  expect(importedStateful()).toBe(2);
  expect(requiredStateful()).toBe(3);
  expect(importedStateful()).toBe(4);
  expect(requiredStateful()).toBe(5);
  expect(requiredStateful()).toBe(6);
});

test('import from mjs and import(mjs) should share caches', async () => {
  const {default: importedStateful} = await import('../stateful.mjs');

  expect(importedStateful()).toBe(1);
  expect(importedStateful()).toBe(2);
  expect(staticImportedStateful()).toBe(3);
  expect(importedStateful()).toBe(4);
  expect(staticImportedStateful()).toBe(5);
  expect(staticImportedStateful()).toBe(6);
});

test('import cjs via import statement', () => {
  expect(staticImportedStatefulFromCjs(4)).toBe(2);
});

test('handle unlinked dynamic imports', async () => {
  const {double: deepDouble} = await import('../dynamicImport');

  expect(deepDouble).toBe(double);

  expect(deepDouble(4)).toBe(8);
});

test('can import `jest` object', () => {
  expect(jestObject).toBeDefined();
});

test('handle dynamic imports of the same module in parallel', async () => {
  const [{double: first}, {double: second}] = await Promise.all([
    import('../anotherDynamicImport.js'),
    import('../anotherDynamicImport.js'),
  ]);

  expect(first).toBe(second);
  expect(first(2)).toBe(4);
});

test('varies module cache by query', () => {
  expect(staticImportedStatefulWithQuery).not.toBe(
    staticImportedStatefulWithAnotherQuery,
  );

  expect(staticImportedStatefulWithQuery()).toBe(1);
  expect(staticImportedStatefulWithQuery()).toBe(2);
  expect(staticImportedStatefulWithAnotherQuery()).toBe(1);
  expect(staticImportedStatefulWithQuery()).toBe(3);
  expect(staticImportedStatefulWithAnotherQuery()).toBe(2);
  expect(staticImportedStatefulWithAnotherQuery()).toBe(3);
});

test('supports named imports from CJS', () => {
  expect(half(4)).toBe(2);
  expect(namedFunction()).toBe('hello from a named CJS function!');
  expect(defaultFromCjs.default()).toBe('"default" export');

  expect(Object.keys(defaultFromCjs)).toEqual([
    'half',
    'namedFunction',
    'default',
  ]);
});

test('supports file urls as imports', async () => {
  const dynamic = await import(new URL('../stateful.mjs', import.meta.url));

  expect(dynamic.default).toBe(staticImportedStateful);
});

test('namespace export', () => {
  expect(bag.double).toBe(double);
});

test('handle circular dependency', async () => {
  const moduleA = (await import('../circularDependentA.mjs')).default;
  expect(moduleA.id).toBe('circularDependentA');
  expect(moduleA.moduleB.id).toBe('circularDependentB');
  expect(moduleA.moduleB.moduleA).toBe(moduleA);
});

test('require of ESM should throw correct error', () => {
  const require = createRequire(import.meta.url);

  expect(() => require('../fromCjs.mjs')).toThrow(
    expect.objectContaining({
      code: 'ERR_REQUIRE_ESM',
      message: expect.stringContaining('Must use import to load ES Module'),
    }),
  );
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

test('supports imports using "node:" prefix', () => {
  expect(dns).toBe(prefixDns);
});

test('supports imports from "data:text/javascript" URI with charset=utf-8 encoding', async () => {
  const code = 'export const something = "some value"';
  const importedEncoded = await import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`
  );
  expect(importedEncoded.something).toBe('some value');
});

test('supports imports from "data:text/javascript" URI with base64 encoding', async () => {
  const code = 'export const something = "some value"';
  const importedBase64 = await import(
    `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  );
  expect(importedBase64.something).toBe('some value');
});

test('supports imports from "data:text/javascript" URI without explicit encoding', async () => {
  const code = 'export const something = "some value"';
  const importedEncoded = await import(
    `data:text/javascript,${encodeURIComponent(code)}`
  );
  expect(importedEncoded.something).toBe('some value');
});

test('imports from "data:text/javascript" URI with invalid encoding fail', async () => {
  const code = 'export const something = "some value"';
  await expect(
    () =>
      import(
        `data:text/javascript;charset=badEncoding,${encodeURIComponent(code)}`
      ),
  ).rejects.toThrow('Invalid data URI');
});

test('imports from "data:" URI with invalid mime type fail', async () => {
  const code = 'export const something = "some value"';
  await expect(
    () => import(`data:something/else,${encodeURIComponent(code)}`),
  ).rejects.toThrow('Invalid data URI');
});

test('imports from "data:text/javascript" URI with invalid data fail', async () => {
  await expect(
    () => import('data:text/javascript;charset=utf-8,so(me)+.-gibberish'),
  ).rejects.toThrow("Unexpected token '.'");
});

test('supports imports from "data:application/json" URI', async () => {
  const data = await import('data:application/json,{"foo": "bar"}');
  expect(data.default).toEqual({foo: 'bar'});
});

test('supports static "data:" URI import', async () => {
  const module = await import('../staticDataImport.js');
  expect(module.value()).toEqual({bar: {obj: 456}, foo: '123'});
});

test('imports from "data:" URI is properly cached', async () => {
  const code =
    'export const wrapper = {value: 123}\nexport const set = (value) => wrapper.value = value';
  const data1 = await import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`
  );
  expect(data1.wrapper.value).toBe(123);
  data1.set(234);
  expect(data1.wrapper.value).toBe(234);
  const data2 = await import(
    `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  );
  expect(data2.wrapper.value).toBe(123);
  const data3 = await import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`
  );
  expect(data3.wrapper.value).toBe(234);
});

test('can mock "data:" URI module', async () => {
  const code = 'export const something = "some value"';
  const dataModule = `data:text/javascript;base64,${Buffer.from(code).toString(
    'base64',
  )}`;
  jestObject.unstable_mockModule(dataModule, () => ({foo: 'bar'}), {
    virtual: true,
  });
  const mocked = await import(dataModule);
  expect(mocked.foo).toBe('bar');
});

test('can import with module reset', async () => {
  const {default: yargs} = await import('yargs');
  const {default: yargsAgain} = await import('yargs');

  expect(yargs).toBe(yargsAgain);

  let args = yargs().parse([]);

  expect(args._).toEqual([]);

  jestObject.resetModules();

  const {default: yargsYetAgain} = await import('yargs');

  expect(yargs).not.toBe(yargsYetAgain);

  args = yargsYetAgain().parse([]);

  expect(args._).toEqual([]);
});
