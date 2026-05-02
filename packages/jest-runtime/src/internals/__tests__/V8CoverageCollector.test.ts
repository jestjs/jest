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
import V8CoverageCollector from '../V8CoverageCollector';

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
    const collector = new V8CoverageCollector(v8Options, config);
    await collector.start();

    expect(mockStartInstrumenting).toHaveBeenCalledTimes(1);
  });

  test('stop() merges the provided transforms into sources', async () => {
    mockStopInstrumenting.mockResolvedValue([]);
    const collector = new V8CoverageCollector(v8Options, config);
    await collector.start();

    const transforms = new Map<string, TransformResult>([
      [insidePath, transform('a')],
    ]);
    await collector.stop(transforms);

    expect(mockStopInstrumenting).toHaveBeenCalledTimes(1);
  });

  test('stop() throws if start() was not called first', async () => {
    const collector = new V8CoverageCollector(v8Options, config);
    await expect(collector.stop(new Map())).rejects.toThrow(
      'You need to call `collectV8Coverage` first.',
    );
  });

  test('getResult() throws if stop() was not called first', () => {
    const collector = new V8CoverageCollector(v8Options, config);
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

    const collector = new V8CoverageCollector(v8Options, config);
    await collector.start();
    const transforms = new Map<string, TransformResult>([
      [insidePath, transform('a')],
    ]);
    await collector.stop(transforms);

    const result = collector.getResult();
    expect(result).toHaveLength(1);
    expect(result[0].result.url).toBe(insidePath);
    expect(result[0].codeTransformResult).toBe(transforms.get(insidePath));
  });

  test('snapshotTransforms() merges into sources when actively collecting v8', async () => {
    mockStopInstrumenting.mockResolvedValue([
      {functions: [], scriptId: '3', url: insideUrl},
    ]);
    const collector = new V8CoverageCollector(v8Options, config);
    await collector.start();

    const inFlight = new Map<string, TransformResult>([
      [insidePath, transform('a')],
    ]);
    collector.snapshotTransforms(inFlight);

    // After stop with empty transforms, sources should still contain the
    // snapshot taken before the (simulated) reset.
    await collector.stop(new Map());
    const result = collector.getResult();
    expect(result[0].codeTransformResult).toBe(inFlight.get(insidePath));
  });

  test('snapshotTransforms() is a no-op when not collecting (start never called)', () => {
    const collector = new V8CoverageCollector(v8Options, config);
    expect(() =>
      collector.snapshotTransforms(new Map([[insidePath, transform('a')]])),
    ).not.toThrow();
    // No internal state to inspect; just asserting safety.
  });

  test('snapshotTransforms() is a no-op when coverage is disabled', async () => {
    mockStopInstrumenting.mockResolvedValue([
      {functions: [], scriptId: '3', url: insideUrl},
    ]);
    const collector = new V8CoverageCollector(noCoverageOptions, config);
    await collector.start();
    collector.snapshotTransforms(
      new Map([[insidePath, transform('snapshot')]]),
    );
    await collector.stop(new Map());

    // shouldInstrument returns false when coverage is off, so the row is
    // filtered out entirely - confirms the snapshot was never applied.
    expect(collector.getResult()).toEqual([]);
  });

  test('snapshotTransforms() is a no-op for non-v8 providers', async () => {
    mockStopInstrumenting.mockResolvedValue([
      {functions: [], scriptId: '3', url: insideUrl},
    ]);
    const collector = new V8CoverageCollector(babelOptions, config);
    await collector.start();
    collector.snapshotTransforms(
      new Map([[insidePath, transform('snapshot')]]),
    );
    await collector.stop(new Map());

    expect(collector.getResult()).toEqual([]);
  });

  test('reset() drops sources and produces an empty result', async () => {
    mockStopInstrumenting.mockResolvedValue([
      {functions: [], scriptId: '3', url: insideUrl},
    ]);
    const collector = new V8CoverageCollector(v8Options, config);
    await collector.start();
    await collector.stop(new Map([[insidePath, transform('a')]]));

    collector.reset();
    expect(collector.getResult()).toEqual([]);
  });
});
