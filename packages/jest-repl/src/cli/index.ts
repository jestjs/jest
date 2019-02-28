#!/usr/bin/env node
/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import Runtime from 'jest-runtime';
import yargs from 'yargs';
import {validateCLIOptions} from 'jest-validate';
import {deprecationEntries} from 'jest-config';
import {Config} from '@jest/types';
import * as args from './args';

const {version: VERSION} = require('../../package.json');

const REPL_SCRIPT = require.resolve('./repl.js');

export = function() {
  const argv = <Config.Argv>yargs.usage(args.usage).options(args.options).argv;

  // @ts-ignore: fix this at some point
  validateCLIOptions(argv, {...args.options, deprecationEntries});

  argv._ = [REPL_SCRIPT];

  Runtime.runCLI(argv, [`Jest REPL v${VERSION}`]);
};
