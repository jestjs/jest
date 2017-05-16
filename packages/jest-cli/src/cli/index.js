/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Path} from 'types/Config';
import type {Argv} from 'types/Argv';

const {validateCLIOptions} = require('jest-util');
const yargs = require('yargs');
const args = require('./args');
const getJest = require('./getJest');
const runCLI = require('./runCLI');

function run(argv?: Argv, project?: Path) {
  argv = yargs(argv || process.argv.slice(2))
    .usage(args.usage)
    .help()
    .alias('help', 'h')
    .options(args.options)
    .epilogue(args.docs)
    .check(args.check).argv;

  validateCLIOptions(argv, args.options);

  if (!project) {
    project = process.cwd();
  }

  if (!argv.projects) {
    argv.projects = [project];
  }

  const execute = argv.projects.length === 1 ? getJest(project).runCLI : runCLI;
  execute(argv, argv.projects, result => {
    const code = !result || result.success ? 0 : 1;
    process.on('exit', () => process.exit(code));
    if (argv && argv.forceExit) {
      process.exit(code);
    }
  });
}

exports.run = run;
exports.runCLI = runCLI;
