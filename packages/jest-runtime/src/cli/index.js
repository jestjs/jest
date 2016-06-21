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

const args = require('./args');
const path = require('path');
const yargs = require('yargs');

const Console = require('jest-util').Console;
const getPackageRoot = require('jest-util').getPackageRoot;
const warnAboutUnrecognizedOptions = require('jest-util').warnAboutUnrecognizedOptions;
const readConfig = require('jest-config').readConfig;
const Runtime = require('../');

const VERSION = require('../../package.json').version;

function run(cliArgv?: Object, cliInfo?: Array<string>) {
  let argv;
  if (cliArgv) {
    argv = cliArgv;
  } else {
    argv = yargs
      .usage(args.usage)
      .options(args.options)
      .argv;

    warnAboutUnrecognizedOptions(argv, args.options);
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

  const root = getPackageRoot();
  const testFilePath = path.resolve(process.cwd(), argv._[0]);
  const info = cliInfo ? cliInfo.join(', ') : '';

  console.log(`Using Jest Runtime v${VERSION}, ${info}`);

  readConfig(argv, root)
    .then(config => {
      Runtime.buildHasteMap(config, {maxWorkers: 1})
        .then(hasteMap => {
          /* $FlowFixMe */
          const TestEnvironment = require(config.testEnvironment);

          const env = new TestEnvironment(config);
          env.global.console = new Console(process.stdout, process.stderr);
          env.global.jestConfig = config;

          const moduleLoader = new Runtime(config, env, hasteMap.resolver);
          moduleLoader.requireModule(testFilePath);
        })
        .catch(e => {
          console.error(e);
          process.on('exit', () => process.exit(1));
        });
    });
}

exports.run = run;
