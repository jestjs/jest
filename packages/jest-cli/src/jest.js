/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {version as VERSION} from '../package.json';

import SearchSource from './search_source';
import TestScheduler from './test_scheduler';
import TestWatcher from './test_watcher';
import {run, runCLI} from './cli';

module.exports = {
  SearchSource,
  TestScheduler,
  TestWatcher,
  getVersion: () => VERSION,
  run,
  runCLI,
};
