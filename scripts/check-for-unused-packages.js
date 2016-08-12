/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const chalk = require('chalk');
const fs = require('fs');
const getPackages = require('./_getPackages');
const glob = require('glob');
const path = require('path');

const isPath = module => !module.match(/^[\.\/]/);

console.log(
  'List of packages that are defined in `package.json` but never ' +
  'used in the source code\n'
);

getPackages().map(pkgPath => {
  const pkgJson = path.resolve(pkgPath, 'package.json');
  const content = require(pkgJson);

  const deps = new Set();

  Object.keys(content.dependencies || []).forEach(name => deps.add(name));
  Object.keys(content.dependencies || []).forEach(name => deps.add(name));

  const requires = new Set();

  const pattern = path.resolve(pkgPath, 'src/**/*.js');
  const files = glob.sync(pattern, {nodir: true});

  const realDeps = files
    .map(file => fs.readFileSync(file).toString())
    .map(code => code.match(/require\(.*\)/g) || [])
    .reduce((requires, matches) => requires.concat(matches), [])
    .map(req => req.match(/\([\'\"\`](.*)[\'\"\`]\)/))
    .filter(module => !!module) // strip dynamic requries (no matches)
    .map(match => match[1])
    .filter(isPath)
    .reduce((set, module) => set.add(module), new Set());

  const unused = new Set();

  deps.forEach(dep => realDeps.has(dep) || unused.add(dep));

  if (unused.size) {
    console.log(path.basename(pkgPath), chalk.red(Array.from(unused).join()));
  }
});
