/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  // @ts-expect-error - added in Node 19.4.0
  availableParallelism,
  cpus,
} from 'os';
import * as path from 'path';
import * as util from 'util';
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
  let argv: Config.Argv;
  if (cliArgv) {
    argv = cliArgv;
  } else {
    argv = yargs
      .usage(args.usage)
      .help(false)
      .version(false)
      .options(args.options).argv as Config.Argv;

    validateCLIOptions(argv, {...args.options, deprecationEntries});
  }

  if (argv.help === true) {
    yargs.showHelp();
    process.on('exit', () => (process.exitCode = 1));
    return;
  }

  if (argv.version == true) {
    console.log(`v${VERSION}\n`);
    return;
  }

  if (argv._.length === 0) {
    console.log('Please provide a path to a script. (See --help for details)');
    process.on('exit', () => (process.exitCode = 1));
    return;
  }

  const root = tryRealpath(process.cwd());
  const filePath = path.resolve(root, argv._[0].toString());

  if (argv.debug === true) {
    const info = cliInfo ? `, ${cliInfo.join(', ')}` : '';
    console.log(`Using Jest Runtime v${VERSION}${info}`);
  }
  const options = await readConfig(argv, root);
  const globalConfig = options.globalConfig;
  // Always disable automocking in scripts.
  const projectConfig: Config.ProjectConfig = {
    ...options.projectConfig,
    automock: false,
  };

  try {
    const numCpus: number =
      typeof availableParallelism === 'function'
        ? availableParallelism()
        : cpus().length;

    const hasteMap = await Runtime.createContext(projectConfig, {
      maxWorkers: Math.max(numCpus - 1, 1),
      watchman: globalConfig.watchman,
    });

    const transformer = await createScriptTransformer(projectConfig);
    const Environment: typeof JestEnvironment =
      await transformer.requireAndTranspileModule(
        projectConfig.testEnvironment,
      );

    const customConsole = new CustomConsole(process.stdout, process.stderr);
    const environment = new Environment(
      {
        globalConfig,
        projectConfig,
      },
      {console: customConsole, docblockPragmas: {}, testPath: filePath},
    );
    setGlobal(environment.global, 'console', customConsole);
    setGlobal(environment.global, 'jestProjectConfig', projectConfig);
    setGlobal(environment.global, 'jestGlobalConfig', globalConfig);

    const runtime = new Runtime(
      projectConfig,
      environment,
      hasteMap.resolver,
      transformer,
      new Map(),
      {
        changedFiles: undefined,
        collectCoverage: false,
        collectCoverageFrom: [],
        coverageProvider: 'v8',
        sourcesRelatedToTestsInChangedFiles: undefined,
      },
      filePath,
      globalConfig,
    );

    for (const path of projectConfig.setupFiles) {
      const esm = runtime.unstable_shouldLoadAsEsm(path);

      if (esm) {
        await runtime.unstable_importModule(path);
      } else {
        const setupFile = runtime.requireModule(path);
        if (typeof setupFile === 'function') {
          await setupFile();
        }
      }
    }

    const esm = runtime.unstable_shouldLoadAsEsm(filePath);

    if (esm) {
      await runtime.unstable_importModule(filePath);
    } else {
      runtime.requireModule(filePath);
    }
  } catch (error: any) {
    console.error(
      chalk.red(util.types.isNativeError(error) ? error.stack : error),
    );
    process.on('exit', () => {
      process.exitCode = 1;
    });
  }
}
