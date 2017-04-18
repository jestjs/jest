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
import type {Path} from 'types/Config';

const Runtime = require('jest-runtime');

const chalk = require('chalk');
const {Console, clearLine} = require('jest-util');
const {createDirectory} = require('jest-util');
const createContext = require('../lib/createContext');
const getMaxWorkers = require('../lib/getMaxWorkers');
const logDebugMessages = require('../lib/logDebugMessages');
const preRunMessage = require('../preRunMessage');
const readConfig = require('jest-config').readConfig;
const runJest = require('../runJest');
const TestWatcher = require('../TestWatcher');
const watch = require('../watch');

const VERSION = require('../../package.json').version;

module.exports = (
  argv: Object,
  root: Path,
  onComplete: (results: ?AggregatedResult) => void,
) => {
  const realFs = require('fs');
  const fs = require('graceful-fs');
  fs.gracefulify(realFs);

  const pipe = argv.json ? process.stderr : process.stdout;
  argv = argv || {};
  if (argv.version) {
    pipe.write(`v${VERSION}\n`);
    onComplete && onComplete();
    return;
  }

  const _run = async ({config, hasDeprecationWarnings}) => {
    if (argv.debug || argv.showConfig) {
      logDebugMessages(config, pipe);
    }

    if (argv.showConfig) {
      process.exit(0);
    }

    createDirectory(config.cacheDirectory);
    const hasteMapInstance = Runtime.createHasteMap(config, {
      console: new Console(pipe, pipe),
      maxWorkers: getMaxWorkers(argv),
      resetCache: !config.cache,
      watch: config.watch,
    });

    const hasteMap = await hasteMapInstance.build();
    const context = createContext(config, hasteMap);
    if (argv.watch || argv.watchAll) {
      return watch(
        config,
        pipe,
        argv,
        hasteMapInstance,
        context,
        hasDeprecationWarnings,
      );
    } else {
      const startRun = () => {
        preRunMessage.print(pipe);
        const testWatcher = new TestWatcher({isWatchMode: false});
        return runJest(
          context,
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
  };

  readConfig(argv, root).then(_run).catch(error => {
    clearLine(process.stderr);
    clearLine(process.stdout);
    console.error(chalk.red(error.stack));
    process.exit(1);
  });
};
