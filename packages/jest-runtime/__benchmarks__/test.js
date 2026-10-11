/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Measures what loading a module costs, for both CJS `require` and ESM
 * `import`. A generated binary tree of modules is loaded from a single test
 * file, `jest.resetModules()` between rounds so every round pays full price:
 * resolution, the mock decision, the transform lookup and the file read all
 * start cold, as they do in a fresh worker. Every module also requires
 * `node:path`, so the core-module path is exercised too.
 *
 * `transform: {}` keeps Babel out of the measurement.
 *
 * Needs `yarn build:js` first — this spawns the built CLI rather than reaching
 * into `src`, because a `Runtime` cannot be built without a config, an
 * environment and a haste map around it.
 *
 * To start the test, run:
 *   node test.js
 *   node test.js 30 cjs
 *
 * A single number here means nothing: absolute timings move with the machine,
 * the Node version and whatever else is running. To compare two revisions,
 * swap `packages/jest-runtime/src` between them and rebuild between
 * measurements, alternating instead of measuring each revision once, so drift
 * lands on both sides. Read the `modules` column, not `total` — `startup` is
 * the same fixture with zero rounds, and it dominates a short run.
 *
 * Measured on an M-series laptop, Node v26.7.0, 30 rounds, alternating twice
 * against the per-require work removed in #16376, reading the `modules`
 * column:
 *
 *     CJS   1992 ms -> 1893 ms   and   2013 ms -> 1886 ms
 *     ESM   3031 ms -> 2937 ms   and   3018 ms -> 2962 ms
 *
 * about 5-6% of CJS module-loading time and 2-3% of ESM's. Re-runs of the same
 * pair minutes apart moved by more than that gap, which is why two
 * alternations are the minimum worth reporting.
 */

'use strict';

const {spawnSync} = require('node:child_process');
const os = require('node:os');
const path = require('node:path');
const fs = require('graceful-fs');

const NODE_COUNT = 2047; // a complete binary tree, 11 deep
const RUNS = 5;

const JEST_BIN = path.resolve(__dirname, '../../jest-cli/bin/jest.js');

const iterations = Number(process.argv[2] ?? 30);
const onlyMode = process.argv[3];

function writeFixture(root, mode) {
  const extension = mode === 'esm' ? '.mjs' : '.js';
  fs.mkdirSync(path.join(root, 'modules'), {recursive: true});
  fs.mkdirSync(path.join(root, '__tests__'), {recursive: true});

  const manifest = {
    jest: {testEnvironment: 'node', testTimeout: 600_000, transform: {}},
    name: `jest-runtime-benchmark-${mode}`,
    private: true,
    version: '0.0.0',
  };
  if (mode === 'esm') {
    manifest.type = 'module';
  }
  fs.writeFileSync(
    path.join(root, 'package.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  for (let index = 0; index < NODE_COUNT; index++) {
    const children = [2 * index + 1, 2 * index + 2].filter(
      child => child < NODE_COUNT,
    );
    const sum = children.map(child => ` + m${child}`).join('');
    const lines =
      mode === 'esm'
        ? [
            "import * as path from 'node:path';",
            ...children.map(
              child => `import m${child} from './m${child}.mjs';`,
            ),
            `export default ${index} + path.sep.length${sum};`,
          ]
        : [
            "const path = require('node:path');",
            ...children.map(
              child => `const m${child} = require('./m${child}.js');`,
            ),
            `module.exports = ${index} + path.sep.length${sum};`,
          ];
    fs.writeFileSync(
      path.join(root, 'modules', `m${index}${extension}`),
      `${lines.join('\n')}\n`,
    );
  }

  const test =
    mode === 'esm'
      ? [
          "import {expect, jest, test} from '@jest/globals';",
          'const rounds = Number(process.env.BENCHMARK_ROUNDS);',
          "test('loads the tree', async () => {",
          '  for (let round = 0; round < rounds; round++) {',
          '    jest.resetModules();',
          "    const {default: root} = await import('../modules/m0.mjs');",
          "    expect(typeof root).toBe('number');",
          '  }',
          '});',
        ]
      : [
          'const rounds = Number(process.env.BENCHMARK_ROUNDS);',
          "test('loads the tree', () => {",
          '  for (let round = 0; round < rounds; round++) {',
          '    jest.resetModules();',
          "    expect(typeof require('../modules/m0.js')).toBe('number');",
          '  }',
          '});',
        ];
  fs.writeFileSync(
    path.join(root, '__tests__', `benchmark.test${extension}`),
    `${test.join('\n')}\n`,
  );
}

function median(cwd, mode, rounds) {
  const samples = [];
  // The first run is a warmup: it pays for the OS file cache the rest reuse.
  for (let run = 0; run <= RUNS; run++) {
    const start = process.hrtime.bigint();
    const result = spawnSync(
      process.execPath,
      [JEST_BIN, '--no-cache', '--runInBand', '--silent'],
      {
        cwd,
        env: {
          ...process.env,
          BENCHMARK_ROUNDS: String(rounds),
          ...(mode === 'esm'
            ? {NODE_OPTIONS: '--experimental-vm-modules'}
            : undefined),
        },
        stdio: 'pipe',
      },
    );
    if (result.status !== 0) {
      console.error(result.stderr.toString());
      throw new Error(`the ${mode} fixture failed to run`);
    }
    if (run > 0) {
      samples.push(Number(process.hrtime.bigint() - start) / 1e6);
    }
  }
  samples.sort((left, right) => left - right);
  return samples;
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-runtime-benchmark-'));

try {
  for (const mode of ['cjs', 'esm']) {
    if (onlyMode && mode !== onlyMode) continue;

    const cwd = path.join(root, mode);
    writeFixture(cwd, mode);

    const startup = median(cwd, mode, 0);
    const samples = median(cwd, mode, iterations);
    const total = samples[Math.floor(samples.length / 2)];
    const floor = startup[Math.floor(startup.length / 2)];

    console.log(
      `${mode}  total ${total.toFixed(0)} ms   startup ${floor.toFixed(
        0,
      )} ms   modules ${(total - floor).toFixed(0)} ms   (samples ${samples
        .map(sample => sample.toFixed(0))
        .join(' ')})`,
    );
  }
} finally {
  fs.rmSync(root, {force: true, recursive: true});
}
