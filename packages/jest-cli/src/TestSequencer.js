/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AggregatedResult} from 'types/TestResult';
import type {Context} from 'types/Context';
import type {Test} from 'types/TestRunner';
import type {Path} from 'types/Config';
import type {Resolver} from 'types/Resolve';
import type {HasteFS} from 'types/HasteMap';

import fs from 'fs';
// $FlowFixMe: Missing ESM export
import {getCacheFilePath} from 'jest-haste-map';
import DependencyResolver from 'jest-resolve-dependencies';
import {buildSnapshotResolver} from 'jest-snapshot';

const FAIL = 0;
const SUCCESS = 1;

type Cache = {
  [key: string]: [0 | 1, number],
};

// If a test depends on one of these core modules,
// we assume that the test may be slower because it is an "integration test"
// that spawn child processes, accesses the file system, etc.
// The weights are in bytes, just as the file sizes of regular modules.
const coreModuleWeights = {
  child_process: 1000000,
  fs: 100000,
  http: 10000,
  https: 10000,
};

export default class TestSequencer {
  _cache: Map<Context, Cache>;

  constructor() {
    this._cache = new Map();
  }

  _getCachePath(context: Context) {
    const {config} = context;
    return getCacheFilePath(config.cacheDirectory, 'perf-cache-' + config.name);
  }

  _getCache(test: Test) {
    const {context} = test;
    if (!this._cache.has(context) && context.config.cache) {
      const cachePath = this._getCachePath(context);
      if (fs.existsSync(cachePath)) {
        try {
          this._cache.set(
            context,
            JSON.parse(fs.readFileSync(cachePath, 'utf8')),
          );
        } catch (e) {}
      }
    }

    let cache = this._cache.get(context);
    if (!cache) {
      cache = {};
      this._cache.set(context, cache);
    }

    return cache;
  }

  _fileSize(
    path: Path,
    sizes: Map<Path, number>,
    resolver: Resolver,
    hasteFS: HasteFS,
  ): number {
    const cachedSize = sizes.get(path);
    if (cachedSize != null) {
      return cachedSize;
    }

    const size =
      (resolver.isCoreModule(path)
        ? coreModuleWeights[path]
        : hasteFS.getSize(path)) || 0;
    sizes.set(path, size);
    return size;
  }

  _fileSizeRecurseDependencies(test: Test, sizes: Map<Path, number>): number {
    const {resolver, hasteFS, config} = test.context;

    const dependencyResolver = new DependencyResolver(
      resolver,
      hasteFS,
      buildSnapshotResolver(config),
    );
    const recursiveDependencies = dependencyResolver.resolveRecursive(
      test.path,
      {includeCoreModules: true},
    );
    const size =
      Array.from(recursiveDependencies).reduce(
        (sum, path) => sum + this._fileSize(path, sizes, resolver, hasteFS),
        0,
      ) + this._fileSize(test.path, sizes, resolver, hasteFS);

    return size;
  }

  // When running more tests than we have workers available, sort the tests
  // by size - big test files usually take longer to complete, so we run
  // them first in an effort to minimize worker idle time at the end of a
  // long test run.
  //
  // After a test run we store the time it took to run a test and on
  // subsequent runs we use that to run the slowest tests first, yielding the
  // fastest results.
  sort(tests: Array<Test>): Array<Test> {
    const sizes = new Map();
    const hasFailed = (cache, test) =>
      cache[test.path] && cache[test.path][0] === FAIL;
    const time = (cache, test) => cache[test.path] && cache[test.path][1];

    tests.forEach(test => (test.duration = time(this._getCache(test), test)));
    return tests.sort((testA, testB) => {
      const cacheA = this._getCache(testA);
      const cacheB = this._getCache(testB);
      const failedA = hasFailed(cacheA, testA);
      const failedB = hasFailed(cacheB, testB);
      const hasTimeA = testA.duration != null;
      if (failedA !== failedB) {
        return failedA ? -1 : 1;
      } else if (hasTimeA != (testB.duration != null)) {
        // If only one of two tests has timing information, run it last
        return hasTimeA ? 1 : -1;
      } else if (testA.duration != null && testB.duration != null) {
        return testA.duration < testB.duration ? 1 : -1;
      } else {
        return this._fileSizeRecurseDependencies(testA, sizes) <
          this._fileSizeRecurseDependencies(testB, sizes)
          ? 1
          : -1;
      }
    });
  }

  cacheResults(tests: Array<Test>, results: AggregatedResult) {
    const map = Object.create(null);
    tests.forEach(test => (map[test.path] = test));
    results.testResults.forEach(testResult => {
      if (testResult && map[testResult.testFilePath] && !testResult.skipped) {
        const cache = this._getCache(map[testResult.testFilePath]);
        const perf = testResult.perfStats;
        cache[testResult.testFilePath] = [
          testResult.numFailingTests ? FAIL : SUCCESS,
          perf.end - perf.start || 0,
        ];
      }
    });

    this._cache.forEach((cache, context) =>
      fs.writeFileSync(this._getCachePath(context), JSON.stringify(cache)),
    );
  }
}
