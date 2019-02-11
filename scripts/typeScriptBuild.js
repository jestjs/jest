/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const execa = require('execa');
const getPackages = require('./getPackages');

const packages = getPackages();

const packageWithTs = packages.filter(p =>
  fs.existsSync(path.resolve(p, 'tsconfig.json'))
);

execa.sync('tsc', ['-b', ...packageWithTs, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
