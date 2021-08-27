/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {cpus} from 'os';
import * as path from 'path';
import chalk = require('chalk');
import yargs = require('yargs');
import {CustomConsole} from '@jest/console';
import type {JestEnvironment} from '@jest/environment';
import {createScriptTransformer} from '@jest/transform';
import type {Config} from '@jest/types';
import {deprecationEntries, readConfig} from 'jest-config';
import Runtime from 'jest-runtime';
import {setGlobal, tryRealpath} from 'jest-util';
import {validateCLIOptions} from 'jest-validate';
import * as args from './args';
import {VERSION} from './version';

export async function run(
  cliArgv?: Config.Argv,
  cliInfo?: Array<string>,
): Promise<void> {
  let argv;
  if (cliArgv) {
    argv = cliArgv;
  } else {
    argv = <Config.Argv>(
      yargs.usage(args.usage).help(false).version(false).options(args.options)
        .argv
    );

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

  const root = tryRealpath(process.cwd());
  const filePath = path.resolve(root, argv._[0].toString());

  if (argv.debug) {
    const info = cliInfo ? ', ' + cliInfo.join(', ') : '';
    console.log(`Using Jest Runtime v${VERSION}${info}`);
  }
  const options = await readConfig(argv, root);
  const globalConfig = options.globalConfig;
  // Always disable automocking in scripts.
  const config: Config.ProjectConfig = {
    ...options.projectConfig,
    automock: false,
  };

  try {
    const hasteMap = await Runtime.createContext(config, {
      maxWorkers: Math.max(cpus().length - 1, 1),
      watchman: globalConfig.watchman,
    });

    const transformer = await createScriptTransformer(config);
    const Environment: typeof JestEnvironment =
      await transformer.requireAndTranspileModule(config.testEnvironment);

    const environment = new Environment(config);
    setGlobal(
      environment.global as unknown as typeof globalThis,
      'console',
      new CustomConsole(process.stdout, process.stderr),
    );
    setGlobal(
      environment.global as unknown as typeof globalThis,
      'jestProjectConfig',
      config,
    );
    setGlobal(
      environment.global as unknown as typeof globalThis,
      'jestGlobalConfig',
      globalConfig,
    );

    const runtime = new Runtime(
      config,
      environment,
      hasteMap.resolver,
      transformer,
      new Map(),
      {
        changedFiles: undefined,
        collectCoverage: false,
        collectCoverageFrom: [],
        collectCoverageOnlyFrom: undefined,
        coverageProvider: 'v8',
        sourcesRelatedToTestsInChangedFiles: undefined,
      },
      filePath,
    );

    for (const path of config.setupFiles) {
      const esm = runtime.unstable_shouldLoadAsEsm(path);

      if (esm) {
        await runtime.unstable_importModule(path);
      } else {
        runtime.requireModule(path);
      }
    }
    const esm = runtime.unstable_shouldLoadAsEsm(filePath);

    if (esm) {
      await runtime.unstable_importModule(filePath);
    } else {
      runtime.requireModule(filePath);
    }
  } catch (e) {
    console.error(chalk.red(e.stack || e));
    process.on('exit', () => (process.exitCode = 1));
  }
}
