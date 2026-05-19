/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import {pathToFileURL} from 'node:url';
import type {CoverageInstrumenter} from 'collect-v8-coverage';
import {makeProjectConfig} from '@jest/test-utils';
import type {ShouldInstrumentOptions, TransformResult} from '@jest/transform';
import type {TransformCache} from '../TransformCache';
import {V8CoverageCollector} from '../V8CoverageCollector';

function makeTransformCache(): {
  cache: TransformCache;
  entries: Map<string, TransformResult>;
} {
  const entries = new Map<string, TransformResult>();
  return {
    cache: {getEntries: () => entries} as unknown as TransformCache,
    entries,
  };
}

const rootDir = path.resolve('/root');
const insidePath = path.join(rootDir, 'a.js');
const insideUrl = pathToFileURL(insidePath).href;
const outsidePath = path.resolve('/elsewhere', 'x.js');
const outsideUrl = pathToFileURL(outsidePath).href;

const mockStartInstrumenting: jest.MockedFunction<
  CoverageInstrumenter['startInstrumenting']
> = jest.fn();
const mockStopInstrumenting: jest.MockedFunction<
  CoverageInstrumenter['stopInstrumenting']
> = jest.fn();

jest.mock('collect-v8-coverage', () => ({
  CoverageInstrumenter: jest.fn().mockImplementation(() => ({
    startInstrumenting: mockStartInstrumenting,
    stopInstrumenting: mockStopInstrumenting,
  })),
}));

const config = makeProjectConfig({rootDir});

const v8Options: ShouldInstrumentOptions = {
  collectCoverage: true,
  collectCoverageFrom: [],
  coverageProvider: 'v8',
};

const noCoverageOptions: ShouldInstrumentOptions = {
  collectCoverage: false,
  collectCoverageFrom: [],
  coverageProvider: 'v8',
};

const babelOptions: ShouldInstrumentOptions = {
  collectCoverage: true,
  collectCoverageFrom: [],
  coverageProvider: 'babel',
};

const transform = (code: string): TransformResult => ({
  code,
  originalCode: code,
  sourceMapPath: null,
});

beforeEach(() => {
  mockStartInstrumenting.mockReset();
  mockStopInstrumenting.mockReset();
});

describe('V8CoverageCollector', () => {
  test('start() initializes the instrumenter and an empty sources map', async () => {
    const {cache} = makeTransformCache();
    const collector = new V8CoverageCollector(v8Options, config, cache);
    await collector.start();

    expect(mockStartInstrumenting).toHaveBeenCalledTimes(1);
  });

  test('stop() pulls transforms from the TransformCache into sources', async () => {
    mockStopInstrumenting.mockResolvedValue([]);
    const {cache, entries} = makeTransformCache();
    entries.set(insidePath, transform('a'));
    const collector = new V8CoverageCollector(v8Options, config, cache);
    await collector.start();
    await collector.stop();

    expect(mockStopInstrumenting).toHaveBeenCalledTimes(1);
  });

  test('stop() throws if start() was not called first', async () => {
    const {cache} = makeTransformCache();
    const collector = new V8CoverageCollector(v8Options, config, cache);
    await expect(collector.stop()).rejects.toThrow(
      'You need to call `collectV8Coverage` first.',
    );
  });

  test('getResult() throws if stop() was not called first', () => {
    const {cache} = makeTransformCache();
    const collector = new V8CoverageCollector(v8Options, config, cache);
    expect(() => collector.getResult()).toThrow(
      'You need to call `stopCollectingV8Coverage` first.',
    );
  });

  test('getResult() filters file:// URLs under rootDir and attaches transforms', async () => {
    mockStopInstrumenting.mockResolvedValue([
      // outside rootDir - filtered out
      {functions: [], scriptId: '1', url: outsideUrl},
      // not file:// - filtered out
      {functions: [], scriptId: '2', url: 'node:internal/foo'},
      // inside rootDir - kept
      {functions: [], scriptId: '3', url: insideUrl},
    ]);

    const {cache, entries} = makeTransformCache();
    const inside = transform('a');
    entries.set(insidePath, inside);
    const collector = new V8CoverageCollector(v8Options, config, cache);
    await collector.start();
    await collector.stop();

    const result = collector.getResult();
    expect(result).toHaveLength(1);
    expect(result[0].result.url).toBe(insidePath);
    expect(result[0].codeTransformResult).toBe(inside);
  });

  test('snapshotTransforms() preserves entries across a TransformCache reset', async () => {
    mockStopInstrumenting.mockResolvedValue([
      {functions: [], scriptId: '3', url: insideUrl},
    ]);
    const {cache, entries} = makeTransformCache();
    const inside = transform('a');
    entries.set(insidePath, inside);

    const collector = new V8CoverageCollector(v8Options, config, cache);
    await collector.start();

    // Snapshot before the cache is cleared - this is the resetModules order.
    collector.snapshotTransforms();
    entries.clear();

    await collector.stop();
    const result = collector.getResult();
    expect(result[0].codeTransformResult).toBe(inside);
  });

  test('snapshotTransforms() is a no-op when not collecting (start never called)', () => {
    const {cache, entries} = makeTransformCache();
    entries.set(insidePath, transform('a'));
    const collector = new V8CoverageCollector(v8Options, config, cache);
    expect(() => collector.snapshotTransforms()).not.toThrow();
  });

  test('snapshotTransforms() is a no-op when coverage is disabled', async () => {
    mockStopInstrumenting.mockResolvedValue([
      {functions: [], scriptId: '3', url: insideUrl},
    ]);
    const {cache, entries} = makeTransformCache();
    entries.set(insidePath, transform('snapshot'));
    const collector = new V8CoverageCollector(noCoverageOptions, config, cache);
    await collector.start();
    collector.snapshotTransforms();
    entries.clear();
    await collector.stop();

    // shouldInstrument returns false when coverage is off, so the row is
    // filtered out entirely.
    expect(collector.getResult()).toEqual([]);
  });

  test('snapshotTransforms() is a no-op for non-v8 providers', async () => {
    mockStopInstrumenting.mockResolvedValue([
      {functions: [], scriptId: '3', url: insideUrl},
    ]);
    const {cache, entries} = makeTransformCache();
    entries.set(insidePath, transform('snapshot'));
    const collector = new V8CoverageCollector(babelOptions, config, cache);
    await collector.start();
    collector.snapshotTransforms();
    entries.clear();
    await collector.stop();

    expect(collector.getResult()).toEqual([]);
  });

  test('getResult() uses globalRootDir to filter URLs when set', async () => {
    const globalRoot = path.resolve('/global-root');
    const projectRoot = path.join(globalRoot, 'packages', 'project-a');
    const filePath = path.join(globalRoot, 'packages', 'project-b', 'b.js');
    const fileUrl = pathToFileURL(filePath).href;

    mockStopInstrumenting.mockResolvedValue([
      {functions: [], scriptId: '1', url: fileUrl},
    ]);

    const projectConfig = makeProjectConfig({rootDir: projectRoot});
    const optionsWithGlobalRoot: ShouldInstrumentOptions = {
      collectCoverage: true,
      collectCoverageFrom: [],
      coverageProvider: 'v8',
      globalRootDir: globalRoot,
    };

    const {cache, entries} = makeTransformCache();
    entries.set(filePath, transform('b'));
    const collector = new V8CoverageCollector(
      optionsWithGlobalRoot,
      projectConfig,
      cache,
    );
    await collector.start();
    await collector.stop();

    const result = collector.getResult();
    expect(result).toHaveLength(1);
    expect(result[0].result.url).toBe(filePath);
  });

  test('getResult() falls back to config.rootDir when globalRootDir is not set', async () => {
    mockStopInstrumenting.mockResolvedValue([
      {functions: [], scriptId: '1', url: outsideUrl},
    ]);

    const {cache, entries} = makeTransformCache();
    entries.set(outsidePath, transform('x'));
    const collector = new V8CoverageCollector(v8Options, config, cache);
    await collector.start();
    await collector.stop();

    expect(collector.getResult()).toHaveLength(0);
  });

  test('reset() drops sources and produces an empty result', async () => {
    mockStopInstrumenting.mockResolvedValue([
      {functions: [], scriptId: '3', url: insideUrl},
    ]);
    const {cache, entries} = makeTransformCache();
    entries.set(insidePath, transform('a'));
    const collector = new V8CoverageCollector(v8Options, config, cache);
    await collector.start();
    await collector.stop();

    collector.reset();
    expect(collector.getResult()).toEqual([]);
  });
});
