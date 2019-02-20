/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Config} from '@jest/types';
import babelJest from '../index';

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

const mockConfig = {
  moduleFileExtensions: [],
};

afterEach(() => {
  jest.unmock('@babel/core');
});

test(`Returns source string with inline maps when no transformOptions is passed`, () => {
  const result = babelJest.process(
    sourceString,
    'dummy_path.js',
    (mockConfig as unknown) as Config.ProjectConfig,
  ) as any;
  expect(typeof result).toBe('object');
  expect(result.code).toBeDefined();
  expect(result.map).toBeDefined();
  expect(result.code).toMatch('//# sourceMappingURL');
  expect(result.code).toMatch('customMultiply');
  expect(result.map.sources).toEqual(['dummy_path.js']);
  expect(JSON.stringify(result.map.sourcesContent)).toMatch('customMultiply');
});

test('getCacheKey does not depend on the rootDir', () => {
  const getCacheKeyArgs = rootDir => {
    const config = {
      cwd: rootDir,
      rootDir,
    };

    return [
      '// Some code',
      `${rootDir}/foo/bar.js`,
      JSON.stringify(config),
      {config, instrument: true, rootDir: config.rootDir},
    ];
  };

  jest.mock('@babel/core');

  require('@babel/core').loadPartialConfig = options => ({
    babelrc: `${options.cwd}/foo/.babelrc`,
    config: `${options.cwd}/babel.config.js`,
    options: {
      cwd: options.cwd,
      someOtherOption: `${options.cwd}/foo`,
    },
  });

  const cacheKeyForRoot1 = babelJest.getCacheKey(
    ...getCacheKeyArgs('/root1/dir'),
  );
  const cacheKeyForRoot2 = babelJest.getCacheKey(
    ...getCacheKeyArgs('/root2/dir'),
  );

  expect(cacheKeyForRoot1).toEqual(cacheKeyForRoot2);
});
