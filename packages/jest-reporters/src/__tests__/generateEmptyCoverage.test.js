/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'os';
import * as path from 'path';
import istanbulCoverage from 'istanbul-lib-coverage';
import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import {shouldInstrument} from '@jest/transform';
import generateEmptyCoverage from '../generateEmptyCoverage';

jest.mock('@jest/transform', () => ({
  ...jest.requireActual('@jest/transform'),
  shouldInstrument: jest.fn(),
}));

jest.mock('graceful-fs', () => {
  const mockFs = jest.requireActual('graceful-fs');
  mockFs.statSync = jest.fn(() => ({size: 4096}));
  return mockFs;
});

describe('generateEmptyCoverage', () => {
  const coverageMap = istanbulCoverage.createCoverageMap({});
  const rootDir = __dirname;
  const filepath = path.join(rootDir, './sum.js');

  it('generates an empty coverage object for a file without running it', async () => {
    const src = `
    throw new Error('this should not be thrown');

    const a = (b, c) => {
      if (b) {
        return c;
      } else {
        return b;
      }
    };

    module.exports = {
      a,
    };`;

    shouldInstrument.mockReturnValueOnce(true);

    const coverage = await generateEmptyCoverage(
      filepath,
      makeGlobalConfig(),
      makeProjectConfig({
        cacheDirectory: os.tmpdir(),
        cwd: rootDir,
        rootDir,
        transform: [['\\.js$', require.resolve('babel-jest')]],
      }),
    );

    expect(coverage).not.toBeNull();
    expect(coverage.result).toMatchSnapshot({
      url: expect.any(String),
    });
  });

  it('generates a null coverage result when collectCoverage global config is false', async () => {
    const src = `
    const a = (b, c) => {
      if (b) {
        return c;
      } else {
        return b;
      }
    };
    module.exports = { a };
    `;

    shouldInstrument.mockReturnValueOnce(false);

    const nullCoverage = await generateEmptyCoverage(
      filepath,
      makeGlobalConfig(),
      makeProjectConfig({
        cacheDirectory: os.tmpdir(),
        cwd: rootDir,
        rootDir,
        transform: [['\\.js$', require.resolve('babel-jest')]],
      }),
    );

    expect(nullCoverage).toBeNull();
  });
});
