/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeProjectConfig} from '@jest/test-utils';
import babelJest, {createTransformer} from '../index';
import {loadPartialConfig} from '../loadBabelConfig';

jest.mock('../loadBabelConfig', () => {
  const actual = jest.requireActual('@babel/core');

  return {
    loadPartialConfig: jest.fn((...args) => actual.loadPartialConfig(...args)),
    loadPartialConfigAsync: jest.fn((...args) =>
      actual.loadPartialConfigAsync(...args),
    ),
  };
});

const defaultBabelJestTransformer = babelJest.createTransformer(null);

//Mock data for all the tests
const sourceString = `
const sum = (a, b) => a+b;
const difference = (a, b) => a-b;

const customMultiply = (obj, mul) => {
    const {a, ...rest} = obj;
    return a * mul;
}

customMultiply({a: 32, dummy: "test"}, 2);
`;

beforeEach(() => {
  jest.clearAllMocks();
});

test('Returns source string with inline maps when no transformOptions is passed', () => {
  const result = defaultBabelJestTransformer.process(
    sourceString,
    'dummy_path.js',
    {
      cacheFS: new Map<string, string>(),
      config: makeProjectConfig(),
      configString: JSON.stringify(makeProjectConfig()),
      instrument: false,
      transformerConfig: {},
    },
  ) as any;
  expect(typeof result).toBe('object');
  expect(result.code).toBeDefined();
  expect(result.map).toBeDefined();
  expect(result.code).toMatch('//# sourceMappingURL');
  expect(result.code).toMatch('customMultiply');
  expect(result.map!.sources).toEqual(['dummy_path.js']);
  expect(JSON.stringify(result.map!.sourcesContent)).toMatch('customMultiply');
});

test('Returns source string with inline maps when no transformOptions is passed async', async () => {
  const result: any = await defaultBabelJestTransformer.processAsync!(
    sourceString,
    'dummy_path.js',
    {
      cacheFS: new Map<string, string>(),
      config: makeProjectConfig(),
      configString: JSON.stringify(makeProjectConfig()),
      instrument: false,
      transformerConfig: {},
    },
  );
  expect(typeof result).toBe('object');
  expect(result.code).toBeDefined();
  expect(result.map).toBeDefined();
  expect(result.code).toMatch('//# sourceMappingURL');
  expect(result.code).toMatch('customMultiply');
  expect(result.map!.sources).toEqual(['dummy_path.js']);
  expect(JSON.stringify(result.map!.sourcesContent)).toMatch('customMultiply');
});

describe('caller option correctly merges from defaults and options', () => {
  test.each([
    [
      {
        supportsDynamicImport: true,
        supportsStaticESM: true,
      },
      {
        supportsDynamicImport: true,
        supportsStaticESM: true,
      },
    ],
    [
      {
        supportsDynamicImport: false,
        supportsStaticESM: false,
      },
      {
        supportsDynamicImport: false,
        supportsStaticESM: false,
      },
    ],
    [
      {supportsStaticESM: false},
      {
        supportsDynamicImport: false,
        supportsStaticESM: false,
      },
    ],
    [
      {supportsDynamicImport: true},
      {
        supportsDynamicImport: true,
        supportsStaticESM: false,
      },
    ],
  ])('%j -> %j', (input, output) => {
    defaultBabelJestTransformer.process(sourceString, 'dummy_path.js', {
      cacheFS: new Map<string, string>(),
      config: makeProjectConfig(),
      configString: JSON.stringify(makeProjectConfig()),
      instrument: false,
      transformerConfig: {},
      ...input,
    });

    expect(loadPartialConfig).toHaveBeenCalledTimes(1);
    expect(loadPartialConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        caller: {
          name: 'babel-jest',
          ...output,
          supportsExportNamespaceFrom: false,
          supportsTopLevelAwait: false,
        },
      }),
    );
  });
});

test('can pass null to createTransformer', () => {
  const transformer = createTransformer(null);
  transformer.process(sourceString, 'dummy_path.js', {
    cacheFS: new Map<string, string>(),
    config: makeProjectConfig(),
    configString: JSON.stringify(makeProjectConfig()),
    instrument: false,
    transformerConfig: {},
  });

  expect(loadPartialConfig).toHaveBeenCalledTimes(1);
  expect(loadPartialConfig).toHaveBeenCalledWith(
    expect.objectContaining({
      caller: {
        name: 'babel-jest',
        supportsDynamicImport: false,
        supportsExportNamespaceFrom: false,
        supportsStaticESM: false,
        supportsTopLevelAwait: false,
      },
    }),
  );
});
