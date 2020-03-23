/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {writeFileSync} = require('fs');

const pkgPath = require.resolve('../package.json');

const pkg = require('../package.json');

delete pkg.devDependencies.prettier;

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
