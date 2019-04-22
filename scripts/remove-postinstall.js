// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

'use strict';

const {writeFileSync} = require('fs');

const pkgPath = require.resolve('../package.json');

const pkg = require('../package.json');

delete pkg.scripts.postinstall;

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
