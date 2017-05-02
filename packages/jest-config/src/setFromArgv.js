/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Argv, InitialOptions} from 'types/Config';

const specialArgs = ['_', '$0', 'h', 'help', 'config'];

function setFromArgv(config: InitialOptions, argv: Argv) {
  let configFromArgv;
  const argvToConfig = Object.keys(argv)
    .filter(key => argv[key] !== undefined && specialArgs.indexOf(key) === -1)
    .reduce((options: Object, key) => {
      switch (key) {
        case 'coverage':
          options.collectCoverage = argv[key];
          break;
        case 'json':
          options.useStderr = argv[key];
          break;
        case 'watchAll':
          options.watch = argv[key];
          break;
        case 'env':
          options.testEnvironment = argv[key];
          break;
        case 'config':
          break;
        default:
          options[key] = argv[key];
      }
      return options;
    }, {});

  if (argv.config && typeof argv.config === 'string') {
    // If the passed in value looks like JSON, treat it as an object.
    if (argv.config.startsWith('{') && argv.config.endsWith('}')) {
      configFromArgv = JSON.parse(argv.config);
    }
  }

  return Object.assign({}, config, argvToConfig, configFromArgv);
}

module.exports = setFromArgv;
