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
import {Config} from '@jest/types';
import {JestEnvironment} from '@jest/environment';
import {CustomConsole} from '@jest/console';
import {setGlobal} from 'jest-util';
import {validateCLIOptions} from 'jest-validate';
import {readConfig, deprecationEntries} from 'jest-config';
import {VERSION} from '../version';
import {Context} from '../types';
import * as args from './args';

export function run(cliArgv?: Config.Argv, cliInfo?: Array<string>) {
  const realFs = require('fs');
  const fs = require('graceful-fs');
  fs.gracefulify(realFs);

  let argv;
  if (cliArgv) {
    argv = cliArgv;
  } else {
    argv = <Config.Argv>yargs
      .usage(args.usage)
      .help(false)
      .version(false)
      .options(args.options).argv;

    // @ts-ignore: fix this at some point
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
  // TODO: Figure this out
  // @ts-ignore: this might not have the correct arguments
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
      const Environment: typeof JestEnvironment = require(config.testEnvironment);
      const environment = new Environment(config);
      setGlobal(
        environment.global,
        'console',
        new CustomConsole(process.stdout, process.stderr),
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
