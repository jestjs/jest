/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {GlobalConfig, SnapshotUpdateState} from 'types/Config';

type Options = {
  testNamePattern?: string,
  testPathPattern?: string,
  noSCM?: boolean,
  updateSnapshot?: SnapshotUpdateState,
  mode?: 'watch' | 'watchAll',
};

module.exports = (
  globalConfig: GlobalConfig,
  options: Options,
): GlobalConfig => {
  // $FlowFixMe Object.assign
  const newConfig: GlobalConfig = Object.assign({}, globalConfig);

  if (!options) {
    options = {};
  }

  if (options.updateSnapshot) {
    newConfig.updateSnapshot = options.updateSnapshot;
  }

  if (options.mode === 'watch') {
    newConfig.watch = true;
    newConfig.watchAll = false;
  } else if (options.mode === 'watchAll') {
    newConfig.watch = false;
    newConfig.watchAll = true;
  }

  if ('testPathPattern' in options) {
    newConfig.testPathPattern = options.testPathPattern || '';
  }

  if ('testNamePattern' in options) {
    newConfig.testNamePattern = options.testNamePattern || '';
  }

  newConfig.onlyChanged = false;
  newConfig.onlyChanged =
    !newConfig.watchAll &&
    !newConfig.testNamePattern &&
    !newConfig.testPathPattern;

  if (options.noSCM) {
    newConfig.noSCM = true;
  }

  return Object.freeze(newConfig);
};
