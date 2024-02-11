/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'graceful-fs';
import slash = require('slash');
import type {AggregatedResult, Test, TestContext} from '@jest/test-result';
import type {Config} from '@jest/types';
import HasteMap from 'jest-haste-map';

const FAIL = 0;
const SUCCESS = 1;

export type TestSequencerOptions = {
  contexts: ReadonlyArray<TestContext>;
  globalConfig: Config.GlobalConfig;
};

type Cache = {
  [key: string]:
    | [testStatus: typeof FAIL | typeof SUCCESS, testDuration: number]
    | undefined;
};

export type ShardOptions = {
  shardIndex: number;
  shardCount: number;
};

type ShardPositionOptions = ShardOptions & {
  suiteLength: number;
};

/**
 * The TestSequencer will ultimately decide which tests should run first.
 * It is responsible for storing and reading from a local cache
 * map that stores context information for a given test, such as how long it
 * took to run during the last run and if it has failed or not.
 * Such information is used on:
 * TestSequencer.sort(tests: Array<Test>)
 * to sort the order of the provided tests.
 *
 * After the results are collected,
 * TestSequencer.cacheResults(tests: Array<Test>, results: AggregatedResult)
 * is called to store/update this information on the cache map.
 */
export default class TestSequencer {
  private readonly _cache = new Map<TestContext, Cache>();

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-useless-constructor
  constructor(_options: TestSequencerOptions) {}

  _getCachePath(testContext: TestContext): string {
    const {config} = testContext;
    const HasteMapClass = HasteMap.getStatic(config);
    return HasteMapClass.getCacheFilePath(
      config.cacheDirectory,
      `perf-cache-${config.id}`,
    );
  }

  _getCache(test: Test): Cache {
    const {context} = test;
    if (!this._cache.has(context) && context.config.cache) {
      const cachePath = this._getCachePath(context);
      if (fs.existsSync(cachePath)) {
        try {
          this._cache.set(
            context,
            JSON.parse(fs.readFileSync(cachePath, 'utf8')) as Cache,
          );
        } catch {}
      }
    }

    let cache = this._cache.get(context);
    if (!cache) {
      cache = {};
      this._cache.set(context, cache);
    }

    return cache;
  }

  private _shardPosition(options: ShardPositionOptions): number {
    const shardRest = options.suiteLength % options.shardCount;
    const ratio = options.suiteLength / options.shardCount;

    return Array.from({length: options.shardIndex}).reduce<number>(
      (acc, _, shardIndex) => {
        const dangles = shardIndex < shardRest;
        const shardSize = dangles ? Math.ceil(ratio) : Math.floor(ratio);
        return acc + shardSize;
      },
      0,
    );
  }

  /**
   * Select tests for shard requested via --shard=shardIndex/shardCount
   * Sharding is applied before sorting
   *
   * @param tests All tests
   * @param options shardIndex and shardIndex to select
   *
   * @example
   * ```typescript
   * class CustomSequencer extends Sequencer {
   *  shard(tests, { shardIndex, shardCount }) {
   *    const shardSize = Math.ceil(tests.length / options.shardCount);
   *    const shardStart = shardSize * (options.shardIndex - 1);
   *    const shardEnd = shardSize * options.shardIndex;
   *    return [...tests]
   *     .sort((a, b) => (a.path > b.path ? 1 : -1))
   *     .slice(shardStart, shardEnd);
   *  }
   * }
   * ```
   */
  shard(
    tests: Array<Test>,
    options: ShardOptions,
  ): Array<Test> | Promise<Array<Test>> {
    const shardStart = this._shardPosition({
      shardCount: options.shardCount,
      shardIndex: options.shardIndex - 1,
      suiteLength: tests.length,
    });

    const shardEnd = this._shardPosition({
      shardCount: options.shardCount,
      shardIndex: options.shardIndex,
      suiteLength: tests.length,
    });

    return tests
      .map(test => {
        const relativeTestPath = path.posix.relative(
          slash(test.context.config.rootDir),
          slash(test.path),
        );

        return {
          hash: crypto
            .createHash('sha1')
            .update(relativeTestPath)
            .digest('hex'),
          test,
        };
      })
      .sort((a, b) => (a.hash < b.hash ? -1 : a.hash > b.hash ? 1 : 0))
      .slice(shardStart, shardEnd)
      .map(result => result.test);
  }

  /**
   * Sort test to determine order of execution
   * Sorting is applied after sharding
   * @param tests
   *
   * ```typescript
   * class CustomSequencer extends Sequencer {
   *   sort(tests) {
   *     const copyTests = Array.from(tests);
   *     return [...tests].sort((a, b) => (a.path > b.path ? 1 : -1));
   *   }
   * }
   * ```
   */
  sort(tests: Array<Test>): Array<Test> | Promise<Array<Test>> {
    /**
     * Sorting tests is very important because it has a great impact on the
     * user-perceived responsiveness and speed of the test run.
     *
     * If such information is on cache, tests are sorted based on:
     * -> Has it failed during the last run ?
     * Since it's important to provide the most expected feedback as quickly
     * as possible.
     * -> How long it took to run ?
     * Because running long tests first is an effort to minimize worker idle
     * time at the end of a long test run.
     * And if that information is not available they are sorted based on file size
     * since big test files usually take longer to complete.
     *
     * Note that a possible improvement would be to analyse other information
     * from the file other than its size.
     *
     */
    const stats: {[path: string]: number} = {};
    const fileSize = ({path, context: {hasteFS}}: Test) =>
      stats[path] || (stats[path] = hasteFS.getSize(path) ?? 0);

    for (const test of tests) {
      test.duration = this.time(test);
    }
    return tests.sort((testA, testB) => {
      const failedA = this.hasFailed(testA);
      const failedB = this.hasFailed(testB);
      const hasTimeA = testA.duration != null;
      if (failedA !== failedB) {
        return failedA ? -1 : 1;
      } else if (hasTimeA != (testB.duration != null)) {
        // If only one of two tests has timing information, run it last
        return hasTimeA ? 1 : -1;
      } else if (testA.duration != null && testB.duration != null) {
        return testA.duration < testB.duration ? 1 : -1;
      } else {
        return fileSize(testA) < fileSize(testB) ? 1 : -1;
      }
    });
  }

  allFailedTests(tests: Array<Test>): Array<Test> | Promise<Array<Test>> {
    return this.sort(tests.filter(test => this.hasFailed(test)));
  }

  cacheResults(tests: Array<Test>, results: AggregatedResult): void {
    const map = Object.create(null) as Record<string, Test | undefined>;
    for (const test of tests) map[test.path] = test;
    for (const testResult of results.testResults) {
      const test = map[testResult.testFilePath];
      if (test != null && !testResult.skipped) {
        const cache = this._getCache(test);
        const perf = testResult.perfStats;
        const testRuntime =
          perf.runtime ?? test.duration ?? perf.end - perf.start;
        cache[testResult.testFilePath] = [
          testResult.numFailingTests > 0 ? FAIL : SUCCESS,
          testRuntime || 0,
        ];
      }
    }

    for (const [context, cache] of this._cache.entries())
      fs.writeFileSync(this._getCachePath(context), JSON.stringify(cache));
  }

  private hasFailed(test: Test) {
    const cache = this._getCache(test);
    return cache[test.path]?.[0] === FAIL;
  }

  private time(test: Test) {
    const cache = this._getCache(test);
    return cache[test.path]?.[1];
  }
}
