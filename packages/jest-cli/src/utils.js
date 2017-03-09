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

const env = process.env;
const isCI = !!(
  env.CI || // Travis CI, CircleCI, Gitlab CI, Appveyor, CodeShip
  env.CONTINUOUS_INTEGRATION || // Travis CI
  env.BUILD_NUMBER || // Jenkins, TeamCity
  false
);

module.exports = {
  isCI,
};
