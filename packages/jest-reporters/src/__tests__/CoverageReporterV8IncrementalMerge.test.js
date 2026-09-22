/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Regression tests for https://github.com/jestjs/jest/issues/14287: the
// reporter must merge V8 coverage incrementally so the main process does not
// retain every test file's raw V8 coverage output until the end of the run.

jest.mock('@bcoe/v8-coverage', () => {
  const actual = jest.requireActual('@bcoe/v8-coverage');
  return {
    ...actual,
    mergeProcessCovs: jest.fn((...args) => actual.mergeProcessCovs(...args)),
  };
});

jest.mock('v8-to-istanbul', () =>
  jest.fn(() => ({
    applyCoverage: jest.fn(),
    load: jest.fn().mockResolvedValue(undefined),
    toIstanbul: jest.fn(() => ({})),
  })),
);

jest.mock('istanbul-lib-coverage', () => {
  const actual = jest.requireActual('istanbul-lib-coverage');
  return {
    ...actual,
    createCoverageMap: jest.fn(() => ({merge: jest.fn()})),
  };
});

jest.mock('istanbul-lib-report', () => ({
  ...jest.requireActual('istanbul-lib-report'),
  createContext: jest.fn(() => ({})),
}));

const {mergeProcessCovs} = require('@bcoe/v8-coverage');
const {mergeProcessCovs: realMergeProcessCovs} =
  jest.requireActual('@bcoe/v8-coverage');
const fs = require('fs');
const os = require('os');
const path = require('path');

let CoverageReporter;
let sourceMapPath;

beforeEach(() => {
  jest.clearAllMocks();
  CoverageReporter = require('../CoverageReporter').default;

  // `_getCoverageResult` reads the source map file referenced by each
  // code transform result; point every fake transform at one temp file.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-v8cov-'));
  sourceMapPath = path.join(dir, 'transform.map');
  fs.writeFileSync(
    sourceMapPath,
    JSON.stringify({
      version: 3,
      sources: ['input.js'],
      names: [],
      mappings: '',
    }),
  );
});

function makeV8CoverageResult(url, seed) {
  return [
    {
      codeTransformResult: {
        code: 'transformed',
        originalCode: 'original',
        sourceMapPath,
      },
      result: {
        scriptId: `${seed}`,
        url,
        functions: [
          {
            functionName: '',
            // Overlapping ranges so merging actually combines the chunks.
            ranges: [
              {startOffset: 0, endOffset: 100, count: seed % 3},
              {startOffset: 10, endOffset: 50, count: 1 + (seed % 2)},
            ],
            isBlockCoverage: true,
          },
        ],
      },
    },
  ];
}

const TOTAL_RESULTS = 25_000;
const MERGE_THRESHOLD = 10_000; // must match V8_COVERAGE_MERGE_THRESHOLD
const EXPECTED_INCREMENTAL_MERGES = Math.floor(TOTAL_RESULTS / MERGE_THRESHOLD);

function feedResults(reporter) {
  const chunks = [];
  for (let i = 0; i < TOTAL_RESULTS; i++) {
    const chunk = makeV8CoverageResult(`/src/file-${i % 50}.js`, i);
    chunks.push(chunk);
    reporter.onTestResult({}, {v8Coverage: chunk});
  }
  return chunks;
}

test('merges V8 coverage incrementally once pending results cross the threshold', () => {
  const reporter = new CoverageReporter({coverageProvider: 'v8'}, {});

  feedResults(reporter);

  // Merges happened during the run, not only at the end of it.
  expect(mergeProcessCovs).toHaveBeenCalledTimes(EXPECTED_INCREMENTAL_MERGES);

  // The pending queue stays bounded instead of holding every raw chunk.
  const remaining = TOTAL_RESULTS % MERGE_THRESHOLD;
  expect(reporter._v8CoverageResults).toHaveLength(remaining);
  expect(reporter._v8UnmergedScriptCoverageCount).toBe(remaining);
  expect(reporter._v8MergedCoverage).toBeDefined();
  expect(reporter._v8MergedCoverage.result).toHaveLength(50);
});

test('incremental merging produces the same result as a single end-of-run merge', async () => {
  const reporter = new CoverageReporter({coverageProvider: 'v8'}, {});

  const chunks = feedResults(reporter);
  // `mergeProcessCovs` may mutate its inputs, so compare against a pristine copy.
  const expected = realMergeProcessCovs(
    structuredClone(chunks).map(cov => ({result: cov.map(r => r.result)})),
  );

  await reporter._getCoverageResult();

  const calls = mergeProcessCovs.mock.results;
  // Incremental merges during the run plus the final end-of-run merge.
  expect(calls).toHaveLength(EXPECTED_INCREMENTAL_MERGES + 1);
  expect(calls[calls.length - 1].value).toEqual(expected);
});
