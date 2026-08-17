/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Measures what a reported removal costs `buildHasteMap`. A removal makes it
 * discard `map`/`mocks` and walk every tracked file; without one it walks only
 * `changedFiles`. Both runs do the same useful work — one changed file — so the
 * gap between them is the price of the full pass.
 *
 * Nothing here touches the disk: every file is already `visited` with its haste
 * name in `map`, which is the case the shortcut in `processFile` is built for.
 *
 * No build needed — unlike the other benchmarks in the repo this reads `src`
 * through babel, because `FileProcessor` is internal and the built entry point
 * does not expose it.
 *
 * To start the test, run:
 *   node test.js 1000
 *   node test.js 100000
 *
 * Measured on an M-series laptop, median of 5, with deep paths:
 *
 *      1 000 files    0.4 ms
 *     10 000 files    6.2 ms
 *    100 000 files   ~60 ms
 *
 * Handling removals incrementally instead was considered and dropped: ~60 ms
 * once at startup, on runs that saw a deletion, did not justify trusting the
 * cached `map`/`mocks` rather than re-deriving them. Re-run this before
 * revisiting that.
 */

'use strict';

const assert = require('node:assert');
const path = require('node:path');
const {performance} = require('node:perf_hooks');
require('@babel/register')({
  cwd: path.resolve(__dirname, '../../..'),
  extensions: ['.ts', '.js'],
});
const {FileProcessor} = require('../src/lib/FileProcessor');
const {WorkerPool} = require('../src/lib/WorkerPool');

assert(process.argv[2], 'Pass the number of files');

const fileCount = Number(process.argv[2]);
const iterations = 5;
const ROOT = path.join(path.sep, 'root');

function makeOptions() {
  return {
    computeDependencies: true,
    computeSha1: false,
    dependencyExtractor: null,
    hasteImplModulePath: undefined,
    // Real runs configure this, and it is tested per file, so keep the cost in.
    mocksPattern: new RegExp(`${path.sep}__mocks__${path.sep}`),
    platforms: [],
    retainAllFiles: false,
    rootDir: ROOT,
    skipPackageJson: false,
    throwOnModuleCollision: false,
  };
}

// Every file is visited and present in `map`, so `processFile` returns without
// dispatching to a worker. Rebuilt per iteration because buildHasteMap mutates.
function makeHasteMap() {
  const files = new Map();
  const map = new Map();

  for (let i = 0; i < fileCount; i++) {
    const relativeFilePath = path.join(
      'packages',
      `pkg${i % 50}`,
      'src',
      'components',
      `module${i}.js`,
    );
    const moduleName = `module${i}`;
    files.set(relativeFilePath, [moduleName, 1000 + i, 42, 1, '', null]);
    map.set(moduleName, {g: [relativeFilePath, 0]});
  }

  return {
    clocks: new Map(),
    duplicates: new Map(),
    files,
    map,
    mocks: new Map(),
  };
}

async function time(withRemoval) {
  const durations = [];

  for (let i = 0; i < iterations; i++) {
    const hasteMap = makeHasteMap();
    const [firstFile, firstMetadata] = hasteMap.files.entries().next().value;
    // A removal only has to be reported to trigger the full pass; the file is
    // already absent from `files`, exactly as the crawlers leave it.
    const removedFiles = withRemoval
      ? new Map([[path.join('src', 'gone.js'), ['gone', 1, 42, 1, '', null]]])
      : new Map();

    const fileProcessor = new FileProcessor(
      makeOptions(),
      console,
      new WorkerPool({
        maxWorkers: 1,
        workerPath: require.resolve('../src/worker'),
      }),
    );

    const startTime = performance.now();
    const result = await fileProcessor.buildHasteMap(
      {
        changedFiles: new Map([[firstFile, firstMetadata]]),
        hasteMap,
        removedFiles,
      },
      () => {},
    );
    durations.push(performance.now() - startTime);

    // Guard against timing a no-op: the surviving files must still be mapped.
    assert.strictEqual(result.map.size, fileCount);
  }

  durations.sort((a, b) => a - b);
  return durations[Math.floor(durations.length / 2)];
}

async function main() {
  // Warm up so the first measured run does not absorb the JIT cost.
  await time(true);

  const withoutRemoval = await time(false);
  const withRemoval = await time(true);

  console.log('-'.repeat(75));
  console.log(`median of ${iterations} runs over ${fileCount} files`);
  console.log(
    'one changed file, no removal:',
    `${withoutRemoval.toFixed(1)} ms`,
  );
  console.log('one changed file, one removal:', `${withRemoval.toFixed(1)} ms`);

  console.log('-'.repeat(75));
  console.log(
    'cost of the full pass a removal forces:',
    `${(withRemoval - withoutRemoval).toFixed(1)} ms`,
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
