/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {Config} from 'types/Config';
import type {Environment} from 'types/Environment';
import type Runtime from 'jest-runtime';

const Benchmark = require('benchmark');
const {startBenchmark} = require('./reporter');

function createBenchmark(name, scenarios, beforeEach, afterEach) {
  return {
    afterEach,
    beforeEach,
    name,
    scenarios,
  };
}

function createScenario(name, func) {
  return {
    func,
    name,
  };
}

function noOp() {
  console.warn('No-op');
}

async function runBenchmark(
  benchPath,
  {afterEach, beforeEach, scenarios, name},
) {
  const suite = new Benchmark.Suite();

  for (let i = 0; i < scenarios.length; i++) {
    const {func, name} = scenarios[i];

    suite.add(name, {
      defer: true,
      fn: deferred => {
        const returnVal = func();

        if (returnVal && returnVal.then) {
          returnVal.then(() => {
            deferred.resolve();
          }).catch(err => {
            throw err;
          });
        } else {
          deferred.resolve();
        }
      },
    });
  }
  const endBenchmark = await startBenchmark(benchPath, name);
  return await new Promise((resolve, reject) => {
    if (beforeEach) {
      beforeEach();
    }
    suite.on('complete', function() {
      if (afterEach) {
        afterEach();
      }
      endBenchmark(this).then(resolve).catch(reject);
    }).run({'async': false});
  });
}

async function jestBenchmark(
  config: Config,
  environment: Environment,
  runtime: Runtime,
  benchPath: string,
) {
  const benchmarks = [];

  try {
    environment.global.benchmark = (benchName, scenariosFunc) => {
      let beforeEach;
      let afterEach;
      const scenarios = [];

      environment.global.beforeEach = beforeEachFunc => {
        beforeEach = beforeEachFunc;
      };

      environment.global.afterEach = afterEachFunc => {
        afterEach = afterEachFunc;
      };

      environment.global.scenario = (scenarioName, benchFunc) => {
        scenarios.push(createScenario(scenarioName, benchFunc));
      };

      scenariosFunc();
      benchmarks.push(
        createBenchmark(benchName, scenarios, beforeEach, afterEach)
      );
    };
    const results = [];

    environment.global.scenario = noOp;
    runtime.requireModule(benchPath);
    environment.global.scenario = noOp;

    for (let i = 0; i < benchmarks.length; i++) {
      results.push(await runBenchmark(benchPath, benchmarks[i]));
    }
    return results;
  } catch (err) {
    throw err;
  }
}

module.exports = jestBenchmark;
