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

import type {Path} from 'types/Config';

const args = require('./args');
const getJest = require('./getJest');
const getPackageRoot = require('jest-util').getPackageRoot;
const path = require('path');
const validateCLIOptions = require('jest-util').validateCLIOptions;
const yargs = require('yargs');

function run(argv?: Object, root?: Path) {
  argv = yargs(argv || process.argv.slice(2))
    .usage(args.usage)
    .help()
    .alias('help', 'h')
    .options(args.options)
    .epilogue(args.docs)
    .check(args.check).argv;

  validateCLIOptions(argv, args.options);

  if (argv.help) {
    yargs.showHelp();
    process.on('exit', () => process.exit(1));
    return;
  }

  if (!root) {
    root = getPackageRoot();
  }

  getJest(root).runCLI(argv, root, result => {
    const code = !result || result.success ? 0 : 1;
    process.on('exit', () => process.exit(code));
    const packageJSONPath = path.join(root || __dirname, 'package.json');
    /* $FlowFixMe */
    const packageJSON = require(packageJSONPath);
    if (argv && argv.forceExit ||
      packageJSON.jest && packageJSON.jest.forceExit) {
      process.exit(code);
    }
  });
}

exports.run = run;
