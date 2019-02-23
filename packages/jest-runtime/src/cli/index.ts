/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import os from 'os';
import path from 'path';
import chalk from 'chalk';
import {sync as realpath} from 'realpath-native';
import yargs from 'yargs';
import {Argv} from '@jest/types';
import {JestEnvironment} from '@jest/environment';
import {Console, setGlobal} from 'jest-util';
// @ts-ignore: Not migrated to TS
import {validateCLIOptions} from 'jest-validate';
// @ts-ignore: Not migrated to TS
import {readConfig, deprecationEntries} from 'jest-config';
import {VERSION} from '../version';
import {Context} from '../types';
import * as args from './args';

export function run(cliArgv?: Argv.Argv, cliInfo?: Array<string>) {
  const realFs = require('fs');
  const fs = require('graceful-fs');
  fs.gracefulify(realFs);

  let argv;
  if (cliArgv) {
    argv = cliArgv;
  } else {
    argv = yargs
      .usage(args.usage)
      .help(false)
      .version(false)
      .options(args.options).argv;

    validateCLIOptions(argv, {...args.options, deprecationEntries});
  }

  if (argv.help) {
    yargs.showHelp();
    process.on('exit', () => (process.exitCode = 1));
    return;
  }

  if (argv.version) {
    console.log(`v${VERSION}\n`);
    return;
  }

  if (!argv._.length) {
    console.log('Please provide a path to a script. (See --help for details)');
    process.on('exit', () => (process.exitCode = 1));
    return;
  }

  const root = realpath(process.cwd());
  const filePath = path.resolve(root, argv._[0]);

  if (argv.debug) {
    const info = cliInfo ? ', ' + cliInfo.join(', ') : '';
    console.log(`Using Jest Runtime v${VERSION}${info}`);
  }
  const options = readConfig(argv, root);
  const globalConfig = options.globalConfig;
  // Always disable automocking in scripts.
  const config = {
    ...options.projectConfig,
    automock: false,
    unmockedModulePathPatterns: null,
  };

  // Break circular dependency
  const Runtime: any = require('..');

  (Runtime.createContext(config, {
    maxWorkers: Math.max(os.cpus().length - 1, 1),
    watchman: globalConfig.watchman,
  }) as Promise<Context>)
    .then(hasteMap => {
      const Environment: JestEnvironment = require(config.testEnvironment);
      const environment = new Environment(config);
      setGlobal(
        environment.global,
        'console',
        new Console(process.stdout, process.stderr),
      );
      setGlobal(environment.global, 'jestProjectConfig', config);
      setGlobal(environment.global, 'jestGlobalConfig', globalConfig);

      const runtime = new Runtime(config, environment, hasteMap.resolver);
      runtime.requireModule(filePath);
    })
    .catch(e => {
      console.error(chalk.red(e.stack || e));
      process.on('exit', () => (process.exitCode = 1));
    });
}
