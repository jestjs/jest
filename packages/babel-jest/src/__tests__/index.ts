/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  BabelFileResult,
  TransformOptions as BabelTransformOptions,
} from '@babel/core';
import {makeProjectConfig, onNodeVersions} from '@jest/test-utils';
import type {SyncTransformer, TransformOptions} from '@jest/transform';
import babelJest, {createTransformer} from '../index';

// We need to use the Node.js implementation of `require` to load Babel 8
// packages, instead of our sandboxed implementation, because Babel 8 is
// written in ESM and we don't support require(esm) yet.
import Module from 'node:module';
import {pathToFileURL} from 'node:url';
const createOriginalNodeRequire = Object.getPrototypeOf(Module).createRequire;
const originalNodeRequire = createOriginalNodeRequire(
  pathToFileURL(__filename),
);

type BabelCore = typeof import('@babel-8/core');

// We need to use `var` so that it's hoisted and we can set it in `jest.mock`.
// eslint-disable-next-line no-var
var mockedBabel!: {
  transformSync: jest.Mock<BabelCore['transformSync']>;
  transformAsync: jest.Mock<BabelCore['transformAsync']>;
  loadPartialConfigSync: jest.Mock<BabelCore['loadPartialConfigSync']>;
  loadPartialConfigAsync: jest.Mock<BabelCore['loadPartialConfigAsync']>;
};

jest.mock('../babel', () => {
  return (mockedBabel = {
    loadPartialConfigAsync: jest.fn<BabelCore['loadPartialConfigAsync']>(),
    loadPartialConfigSync: jest.fn<BabelCore['loadPartialConfigSync']>(),
    transformAsync: jest.fn<BabelCore['transformAsync']>(),
    transformSync: jest.fn<BabelCore['transformSync']>(),
  });
});

const defaultBabelJestTransformer =
  babelJest.createTransformer() as SyncTransformer<BabelTransformOptions>;

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

describe('babel 7', () => {
  defineTests({getBabel: () => require('@babel/core')});
});

describe('babel 8', () => {
  onNodeVersions('>=20', () => {
    defineTests({
      getBabel: () => originalNodeRequire('@babel-8/core'),
    });
  });
});

function defineTests({
  getBabel,
}: {
  getBabel: () => typeof import('@babel-8/core');
}) {
  let babel: typeof import('@babel-8/core');
  beforeAll(() => {
    babel = getBabel();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockedBabel.transformSync.mockImplementation(babel.transformSync);
    mockedBabel.transformAsync.mockImplementation(babel.transformAsync);
    mockedBabel.loadPartialConfigSync.mockImplementation(
      babel.loadPartialConfigSync,
    );
    mockedBabel.loadPartialConfigAsync.mockImplementation(
      babel.loadPartialConfigAsync,
    );
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
      } as TransformOptions<BabelTransformOptions>,
    );

    expect(typeof result).toBe('object');
    expect(result.code).toBeDefined();
    expect(result.map).toBeDefined();
    expect(result.code).toMatch('//# sourceMappingURL');
    expect(result.code).toMatch('customMultiply');
    expect((result as BabelFileResult).map!.sources).toEqual(['dummy_path.js']);
    expect(
      JSON.stringify((result as BabelFileResult).map!.sourcesContent),
    ).toMatch('customMultiply');
  });

  test('Returns source string with inline maps when no transformOptions is passed async', async () => {
    const result = await defaultBabelJestTransformer.processAsync!(
      sourceString,
      'dummy_path.js',
      {
        cacheFS: new Map<string, string>(),
        config: makeProjectConfig(),
        configString: JSON.stringify(makeProjectConfig()),
        instrument: false,
        transformerConfig: {},
      } as TransformOptions<BabelTransformOptions>,
    );

    expect(typeof result).toBe('object');
    expect(result.code).toBeDefined();
    expect(result.map).toBeDefined();
    expect(result.code).toMatch('//# sourceMappingURL');
    expect(result.code).toMatch('customMultiply');

    const {map} = result;

    expect(map).toBeTruthy();
    expect(typeof map).not.toBe('string');

    if (map == null || typeof map === 'string') {
      throw new Error('dead code');
    }

    expect(map.sources).toEqual(['dummy_path.js']);
    expect(JSON.stringify(map.sourcesContent)).toMatch('customMultiply');
  });

  describe('caller option correctly merges from defaults and options', () => {
    test.each([
      [
        {supportsDynamicImport: true, supportsStaticESM: true},
        {supportsDynamicImport: true, supportsStaticESM: true},
      ],
      [
        {supportsDynamicImport: false, supportsStaticESM: false},
        {supportsDynamicImport: false, supportsStaticESM: false},
      ],
      [
        {supportsStaticESM: false},
        {supportsDynamicImport: false, supportsStaticESM: false},
      ],
      [
        {supportsDynamicImport: true},
        {supportsDynamicImport: true, supportsStaticESM: false},
      ],
    ])('%j -> %j', (input, output) => {
      defaultBabelJestTransformer.process(sourceString, 'dummy_path.js', {
        cacheFS: new Map<string, string>(),
        config: makeProjectConfig(),
        configString: JSON.stringify(makeProjectConfig()),
        instrument: false,
        transformerConfig: {},
        ...input,
      } as TransformOptions<BabelTransformOptions>);

      expect(mockedBabel.loadPartialConfigSync).toHaveBeenCalledTimes(1);
      expect(mockedBabel.loadPartialConfigSync).toHaveBeenCalledWith(
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

  test('can pass null to createTransformer', async () => {
    const transformer = await createTransformer();
    transformer.process(sourceString, 'dummy_path.js', {
      cacheFS: new Map<string, string>(),
      config: makeProjectConfig(),
      configString: JSON.stringify(makeProjectConfig()),
      instrument: false,
      transformerConfig: {},
    } as TransformOptions<BabelTransformOptions>);

    expect(mockedBabel.loadPartialConfigSync).toHaveBeenCalledTimes(1);
    expect(mockedBabel.loadPartialConfigSync).toHaveBeenCalledWith(
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

  test('include babel-preset-jest by default', () => {
    defaultBabelJestTransformer.process(sourceString, 'dummy_path.js', {
      cacheFS: new Map<string, string>(),
      config: makeProjectConfig(),
      configString: JSON.stringify(makeProjectConfig()),
      instrument: false,
      transformerConfig: {},
    } as TransformOptions<BabelTransformOptions>);

    expect(mockedBabel.loadPartialConfigSync).toHaveBeenCalledTimes(1);
    expect(mockedBabel.loadPartialConfigSync).toHaveBeenCalledWith(
      expect.objectContaining({
        presets: [require.resolve('babel-preset-jest')],
      }),
    );
  });

  test('can opting out of babel-preset-jest by passing excludeJestPreset: true', async () => {
    const transformer = await createTransformer({excludeJestPreset: true});
    transformer.process(sourceString, 'dummy_path.js', {
      cacheFS: new Map<string, string>(),
      config: makeProjectConfig(),
      configString: JSON.stringify(makeProjectConfig()),
      instrument: false,
      transformerConfig: {},
    } as TransformOptions<BabelTransformOptions>);

    expect(mockedBabel.loadPartialConfigSync).toHaveBeenCalledTimes(1);
    expect(mockedBabel.loadPartialConfigSync).toHaveBeenCalledWith(
      expect.objectContaining({presets: []}),
    );
  });
}
