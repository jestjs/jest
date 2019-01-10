/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {version as VERSION} from '../package.json';

import SearchSource from './SearchSource';
import TestScheduler from './TestScheduler';
import TestWatcher from './TestWatcher';
import {run, runCLI} from './cli';

module.exports = {
  SearchSource,
  TestScheduler,
  TestWatcher,
  getVersion: () => VERSION,
  run,
  runCLI,
};
