/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {shouldInstrument} from '@jest/transform';
import istanbulCoverage from 'istanbul-lib-coverage';
import libSourceMaps from 'istanbul-lib-source-maps';
import generateEmptyCoverage from '../generateEmptyCoverage';

import path from 'path';
import os from 'os';
import {makeGlobalConfig, makeProjectConfig} from '../../../../TestUtils';

jest.mock('@jest/transform', () => ({
  ...jest.requireActual('@jest/transform'),
  shouldInstrument: jest.fn(),
}));

describe('generateEmptyCoverage', () => {
  const coverageMap = istanbulCoverage.createCoverageMap({});
  const sourceMapStore = libSourceMaps.createSourceMapStore();
  const rootDir = '/tmp';
  const filepath = path.join(rootDir, './sum.js');

  it('generates an empty coverage object for a file without running it', () => {
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

    const emptyCoverage = generateEmptyCoverage(
      src,
      filepath,
      makeGlobalConfig(),
      makeProjectConfig({
        cacheDirectory: os.tmpdir(),
        rootDir,
        transform: [['^.+\\.js$', require.resolve('babel-jest')]],
      }),
    );

    expect(emptyCoverage).not.toBeNull();
    expect(typeof emptyCoverage).toBe('object');

    let coverage = emptyCoverage.coverage;

    if (emptyCoverage.sourceMapPath) {
      coverageMap.addFileCoverage(emptyCoverage.coverage);
      sourceMapStore.registerURL(filepath, emptyCoverage.sourceMapPath);

      coverage = sourceMapStore.transformCoverage(coverageMap).map;
    }

    expect(coverage.data).toMatchSnapshot({
      hash: expect.any(String),
      path: expect.any(String),
    });
  });

  it('generates a null coverage result when using /* istanbul ignore file */', () => {
    const src = `
    /* istanbul ignore file */
    const a = (b, c) => {
      if (b) {
        return c;
      } else {
        return b;
      }
    };
    module.exports = { a };
    `;

    shouldInstrument.mockReturnValueOnce(true);

    const nullCoverage = generateEmptyCoverage(
      src,
      filepath,
      makeGlobalConfig(),
      makeProjectConfig({
        cacheDirectory: os.tmpdir(),
        rootDir,
        transform: [['^.+\\.js$', require.resolve('babel-jest')]],
      }),
    );

    expect(nullCoverage).toBeNull();
  });

  it('generates a null coverage result when collectCoverage global config is false', () => {
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

    const nullCoverage = generateEmptyCoverage(
      src,
      filepath,
      makeGlobalConfig(),
      makeProjectConfig({
        cacheDirectory: os.tmpdir(),
        rootDir,
        transform: [['^.+\\.js$', require.resolve('babel-jest')]],
      }),
    );

    expect(nullCoverage).toBeNull();
  });
});
