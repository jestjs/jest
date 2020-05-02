/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';

const specialArgs = ['_', '$0', 'h', 'help', 'config'];
import {isJSONString} from './utils';

export default function setFromArgv(
  options: Config.InitialOptions,
  argv: Config.Argv,
): Config.InitialOptions {
  const argvToOptions = Object.keys(argv)
    .filter(key => argv[key] !== undefined && specialArgs.indexOf(key) === -1)
    .reduce((options: Record<string, unknown>, key) => {
      switch (key) {
        case 'coverage':
          options.collectCoverage = argv[key];
          break;
        case 'json':
          options.useStderr = argv[key];
          break;
        case 'watchAll':
          options.watch = false;
          options.watchAll = argv[key];
          break;
        case 'env':
          options.testEnvironment = argv[key];
          break;
        case 'config':
          break;
        case 'coverageThreshold':
        case 'globals':
        case 'moduleNameMapper':
        case 'transform':
        case 'haste':
          const str = argv[key];
          if (isJSONString(str)) {
            options[key] = JSON.parse(str);
          }
          break;
        default:
          options[key] = argv[key];
      }
      return options;
    }, {});

  return {
    ...options,
    ...(isJSONString(argv.config) ? JSON.parse(argv.config) : null),
    ...argvToOptions,
  };
}
