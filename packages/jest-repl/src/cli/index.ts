#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import yargs from 'yargs';
import type {Config} from '@jest/types';
import {deprecationEntries} from 'jest-config';
import {validateCLIOptions} from 'jest-validate';
import * as args from './args';
import {run as runtimeCLI} from './runtime-cli';
import {VERSION} from './version';

const REPL_SCRIPT = require.resolve('./repl');

export async function run(): Promise<void> {
  const argv = (await yargs(process.argv.slice(2))
    .usage(args.usage)
    .options(args.options).argv) as Config.Argv;

  validateCLIOptions(argv, {...args.options, deprecationEntries});

  argv._ = [REPL_SCRIPT];

  return runtimeCLI(argv, [`Jest REPL v${VERSION}`]);
}
