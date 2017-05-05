/**
* Copyright (c) 2014, Facebook, Inc. All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*
* @flow
*/

'use strict';

import type {Argv} from 'types/Argv';
import type {EnvironmentClass} from 'types/Environment';

const args = require('./args');
const chalk = require('chalk');
const os = require('os');
const path = require('path');
const yargs = require('yargs');

const {Console, setGlobal, validateCLIOptions} = require('jest-util');
const readConfig = require('jest-config').readConfig;
const Runtime = require('../');

const VERSION = (require('../../package.json').version: string);

function run(cliArgv?: Argv, cliInfo?: Array<string>) {
  let argv;
  if (cliArgv) {
    argv = cliArgv;
  } else {
    argv = yargs.usage(args.usage).options(args.options).argv;

    validateCLIOptions(argv, args.options);
  }

  if (argv.help) {
    yargs.showHelp();
    process.on('exit', () => process.exit(1));
    return;
  }

  if (argv.version) {
    console.log(`v${VERSION}\n`);
    return;
  }

  if (!argv._.length) {
    console.log('Please provide a path to a script. (See --help for details)');
    process.on('exit', () => process.exit(1));
    return;
  }

  const root = process.cwd();
  const filePath = path.resolve(root, argv._[0]);

  if (argv.debug) {
    const info = cliInfo ? ', ' + cliInfo.join(', ') : '';
    console.log(`Using Jest Runtime v${VERSION}${info}`);
  }
  const options = readConfig(argv, root);
  const globalConfig = options.globalConfig;
  // Always disable automocking in scripts.
  const config = Object.assign({}, options.config, {
    automock: false,
    unmockedModulePathPatterns: null,
  });
  Runtime.createContext(config, {
    maxWorkers: os.cpus().length - 1,
    watchman: globalConfig.watchman,
  })
    .then(hasteMap => {
      /* $FlowFixMe */
      const Environment = (require(config.testEnvironment): EnvironmentClass);
      const environment = new Environment(config);
      setGlobal(
        environment.global,
        'console',
        new Console(process.stdout, process.stderr),
      );
      environment.global.jestProjectConfig = config;
      environment.global.jestGlobalConfig = globalConfig;

      const runtime = new Runtime(config, environment, hasteMap.resolver);
      runtime.requireModule(filePath);
    })
    .catch(e => {
      console.error(chalk.red(e));
      process.on('exit', () => process.exit(1));
    });
}

exports.run = run;
