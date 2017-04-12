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
import type {Config, Path} from 'types/Config';

const Runtime = require('jest-runtime');

const {Console, clearLine} = require('jest-util');
const {createDirectory} = require('jest-util');
const chalk = require('chalk');
const createContext = require('../lib/createContext');
const getMaxWorkers = require('../lib/getMaxWorkers');
const handleDeprecationWarnings = require('../lib/handleDeprecationWarnings');
const logDebugMessages = require('../lib/logDebugMessages');
const preRunMessage = require('../preRunMessage');
const readConfig = require('jest-config').readConfig;
const runJest = require('../runJest');
const TestWatcher = require('../TestWatcher');
const watch = require('../watch');

const VERSION = require('../../package.json').version;

module.exports = async (
  argv: Object,
  roots: Array<Path>,
  onComplete: (results: ?AggregatedResult) => void,
) => {
  const realFs = require('fs');
  const fs = require('graceful-fs');
  fs.gracefulify(realFs);

  const pipe = argv.json ? process.stderr : process.stdout;
  if (argv.version) {
    pipe.write(`v${VERSION}\n`);
    onComplete && onComplete();
    return;
  }

  const _run = async (
    configs: Array<{config: Config, hasDeprecationWarnings: boolean}>,
  ) => {
    if (argv.debug || argv.showConfig) {
      logDebugMessages(configs[0].config, pipe);
    }

    if (argv.showConfig) {
      process.exit(0);
    }

    const hasteMapInstances = Array(configs.length);
    const contexts = await Promise.all(
      configs.map(async ({config}, index) => {
        createDirectory(config.cacheDirectory);
        const hasteMapInstance = Runtime.createHasteMap(config, {
          console: new Console(pipe, pipe),
          maxWorkers: getMaxWorkers(argv),
          resetCache: !config.cache,
          watch: config.watch,
        });
        hasteMapInstances[index] = hasteMapInstance;
        return createContext(config, await hasteMapInstance.build());
      }),
    );

    if (argv.watch || argv.watchAll) {
      if (configs.some(({hasDeprecationWarnings}) => hasDeprecationWarnings)) {
        try {
          await handleDeprecationWarnings(pipe, process.stdin);
          return watch(contexts, argv, pipe, hasteMapInstances);
        } catch (e) {
          process.exit(0);
        }
      }

      return watch(contexts, argv, pipe, hasteMapInstances);
    } else {
      const startRun = () => {
        preRunMessage.print(pipe);
        runJest(
          contexts,
          argv,
          pipe,
          new TestWatcher({isWatchMode: false}),
          startRun,
          onComplete,
        );
      };
      return startRun();
    }
  };

  try {
    await _run(await Promise.all(roots.map(root => readConfig(argv, root))));
  } catch (error) {
    clearLine(process.stderr);
    clearLine(process.stdout);
    console.error(chalk.red(error.stack));
    process.exit(1);
  }
};
