/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {writeFileSync} = require('fs');
const {resolve} = require('path');
const rimraf = require('rimraf');

const configFile = require.resolve('../jest.config');

const config = require(configFile);

delete config.projects;

writeFileSync(configFile, `module.exports = ${JSON.stringify(config)};\n`);

rimraf.sync(resolve(__dirname, '../examples/'));
