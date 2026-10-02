/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
import istanbulCoverage from 'istanbul-lib-coverage';
import libSourceMaps from 'istanbul-lib-source-maps';
import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import {shouldInstrument} from '@jest/transform';
import generateEmptyCoverage from '../generateEmptyCoverage';

jest.mock('@jest/transform', () => ({
  ...jest.requireActual('@jest/transform'),
  shouldInstrument: jest.fn(),
}));

describe('generateEmptyCoverage', () => {
  const coverageMap = istanbulCoverage.createCoverageMap({});
  const sourceMapStore = libSourceMaps.createSourceMapStore();
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

    const emptyCoverage = await generateEmptyCoverage(
      src,
      filepath,
      makeGlobalConfig(),
      makeProjectConfig({
        cacheDirectory: os.tmpdir(),
        cwd: rootDir,
        rootDir,
        transform: [['\\.js$', require.resolve('babel-jest')]],
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
      path: expect.any(String),
    });
  });

  it('generates a null coverage result when using /* istanbul ignore file */', async () => {
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

    const nullCoverage = await generateEmptyCoverage(
      src,
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
      src,
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

  it('generates a coverage object without statements for a file that is transformed into no code (v8 provider)', async () => {
    const tsFilepath = path.join(rootDir, './__fixtures__/types.ts');

    shouldInstrument.mockReturnValueOnce(true);

    const emptyCoverage = await generateEmptyCoverage(
      fs.readFileSync(tsFilepath, 'utf8'),
      tsFilepath,
      makeGlobalConfig({coverageProvider: 'v8'}),
      makeProjectConfig({
        cacheDirectory: os.tmpdir(),
        cwd: rootDir,
        rootDir,
        transform: [
          [
            '\\.ts$',
            require.resolve('babel-jest'),
            {
              configFile: false,
              presets: [require.resolve('@babel/preset-typescript')],
            },
          ],
        ],
      }),
    );

    expect(emptyCoverage).toEqual({
      coverage: expect.any(Object),
      kind: 'EmptyCoverage',
    });
    expect(emptyCoverage.coverage.path).toBe(tsFilepath);
    expect(emptyCoverage.coverage.statementMap).toEqual({});
    expect(emptyCoverage.coverage.toSummary()).toMatchObject({
      branches: {total: 0},
      functions: {total: 0},
      lines: {total: 0},
      statements: {total: 0},
    });
  });

  it('generates an empty v8 coverage result for untested code (v8 provider)', async () => {
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
    const untestedFilepath = path.join(
      rootDir,
      'generateEmptyCoverage.test.js',
    );

    shouldInstrument.mockReturnValueOnce(true);

    const emptyCoverage = await generateEmptyCoverage(
      src,
      untestedFilepath,
      makeGlobalConfig({coverageProvider: 'v8'}),
      makeProjectConfig({
        cacheDirectory: os.tmpdir(),
        cwd: rootDir,
        rootDir,
        transform: [['\\.js$', require.resolve('babel-jest')]],
      }),
    );

    expect(emptyCoverage).toEqual({
      kind: 'V8Coverage',
      result: {
        functions: [
          {
            functionName: '(empty-report)',
            isBlockCoverage: true,
            ranges: [
              {
                count: 0,
                endOffset: fs.statSync(untestedFilepath).size,
                startOffset: 0,
              },
            ],
          },
        ],
        scriptId: '0',
        url: untestedFilepath,
      },
    });
  });
});
