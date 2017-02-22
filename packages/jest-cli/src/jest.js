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

import type {AggregatedResult} from 'types/TestResult';
import type {Path, Config} from 'types/Config';

const realFs = require('fs');
const fs = require('graceful-fs');
fs.gracefulify(realFs);

const Runtime = require('jest-runtime');
const SearchSource = require('./SearchSource');
const TestRunner = require('./TestRunner');

const chalk = require('chalk');
const {Console, clearLine} = require('jest-util');
const {createDirectory} = require('jest-util');
const createHasteContext = require('./lib/createHasteContext');
const getMaxWorkers = require('./lib/getMaxWorkers');
const logDebugMessages = require('./lib/logDebugMessages');
const preRunMessage = require('./preRunMessage');
const readConfig = require('jest-config').readConfig;
const {run} = require('./cli');
const runJest = require('./runJest');
const TestWatcher = require('./TestWatcher');
const watch = require('./watch');

const VERSION = require('../package.json').version;

const runCLI = (
  argv: Object,
  root: Path,
  onComplete: (results: ?AggregatedResult) => void,
) => {
  const pipe = argv.json ? process.stderr : process.stdout;
  argv = argv || {};
  if (argv.version) {
    pipe.write(`v${VERSION}\n`);
    onComplete && onComplete();
    return;
  }

  readConfig(argv, root)
    .then((
      {
        config,
        hasDeprecationWarnings,
      }: {
        config: Config,
        hasDeprecationWarnings: boolean,
      },
    ) => {
      if (argv.debug) {
        logDebugMessages(config, pipe);
      }

      createDirectory(config.cacheDirectory);
      const jestHasteMap = Runtime.createHasteMap(config, {
        console: new Console(pipe, pipe),
        maxWorkers: getMaxWorkers(argv),
        resetCache: !config.cache,
        watch: config.watch,
      });

      return jestHasteMap
        .build()
        .then(hasteMap => createHasteContext(config, hasteMap), error => {
          throw error;
        })
        .then(hasteContext => {
          if (argv.watch || argv.watchAll) {
            return watch(
              config,
              pipe,
              argv,
              jestHasteMap,
              hasteContext,
              hasDeprecationWarnings,
            );
          } else {
            const startRun = () => {
              preRunMessage.print(pipe);
              const testWatcher = new TestWatcher({isWatchMode: false});
              return runJest(
                hasteContext,
                config,
                argv,
                pipe,
                testWatcher,
                startRun,
                onComplete,
              );
            };
            return startRun();
          }
        });
    })
    .catch(error => {
      clearLine(process.stderr);
      clearLine(process.stdout);
      console.error(chalk.red(error.stack));
      process.exit(1);
    });
};

module.exports = {
  SearchSource,
  TestRunner,
  TestWatcher,
  getVersion: () => VERSION,
  run,
  runCLI,
};
