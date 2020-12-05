#!/usr/bin/env node
/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import yargs = require('yargs');
import type {Config} from '@jest/types';
import {deprecationEntries} from 'jest-config';
import {validateCLIOptions} from 'jest-validate';
import * as args from './args';
import {run as runtimeCLI} from './runtime-cli';
import {VERSION} from './version';

const REPL_SCRIPT = require.resolve('./repl.js');

export = function (): void {
  const argv = <Config.Argv>yargs.usage(args.usage).options(args.options).argv;

  validateCLIOptions(argv, {...args.options, deprecationEntries});

  argv._ = [REPL_SCRIPT];

  runtimeCLI(argv, [`Jest REPL v${VERSION}`]);
};
