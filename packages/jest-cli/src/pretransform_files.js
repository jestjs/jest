/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Test} from 'types/TestRunner';
import type {GlobalConfig} from 'types/Config';
import type {Context} from 'types/Context';

import DependencyResolver from 'jest-resolve-dependencies';
import workerFarm from 'worker-farm';
import pify from 'pify';

// Find all JS dependencies for given tests, transform them and write cache
// files in parallel using multiple workers.
const pretransformFiles = async ({
  allTests,
  globalConfig,
}: {
  allTests: Array<Test>,
  globalConfig: GlobalConfig,
}) => {
  console.warn('\nTrasforming source code');
  const farm = _makeFarm(globalConfig);
  const worker = pify(farm);
  const timeStart = Date.now();

  // This is done using a generator because otherwise it won't scale on
  // large codebases. We need to start transforming files as soon as we
  // start getting any results. Otherwise we'll spend minutes on resolving
  // all files before we can even start transforming.
  const generator = _makeResolverGenerator(allTests, globalConfig);

  const promises = [];
  let filesResolved = 0;

  for (const [config, filePath] of generator) {
    promises.push(worker([[config, filePath]]));
    filesResolved += 1;
  }

  await Promise.all(promises);

  console.warn(
    `Done transforming ${filesResolved} files in ${_timeElapsed(timeStart)}`,
  );
  workerFarm.end(farm);
};

// returns the different between given timestamp and now in '1.23s' format
const _timeElapsed = timestamp =>
  `${((Date.now() - timestamp) / 1000).toFixed(2)}s`;

const _makeFarm = globalConfig =>
  workerFarm(
    {
      autoStart: true,
      maxConcurrentCallsPerWorker: 2,
      maxConcurrentWorkers: globalConfig.maxWorkers,
      maxRetries: 2,
    },
    require.resolve('./pretransform_files_worker'),
  );

// Given a module, recursively find all other modules it depends on
function* _makeResolverGenerator(allTests, globalConfig) {
  const dataByContext: Map<
    Context,
    {
      dependencies: Set<string>,
      resolver: DependencyResolver,
      resolved: Set<string>,
    },
  > = new Map();

  for (const test of allTests) {
    if (!dataByContext.has(test.context)) {
      dataByContext.set(test.context, {
        dependencies: new Set(),
        resolved: new Set(),
        resolver: new DependencyResolver(
          test.context.resolver,
          test.context.hasteFS,
        ),
      });
    }

    // $FlowFixMe flow doesn't refine maps
    const {dependencies, resolver, resolved} = dataByContext.get(test.context);

    const queue = new Set([test.path]);

    for (const next of queue) {
      queue.delete(next);
      resolved.add(next);
      const moduleDeps = resolver.resolve(next);
      for (const dependency of moduleDeps) {
        if (!dependencies.has(dependency)) {
          dependencies.add(dependency);
          yield [test.context.config, dependency];
        }
        if (!resolved.has(dependency)) {
          queue.add(dependency);
        }
      }
    }
  }
}

export default pretransformFiles;
