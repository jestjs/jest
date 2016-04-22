/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const execute = require('./execute');
const path = require('path');
const isWindows = process.platform === 'win32';

console.log(`Setting up Jest's development environment...`);
const npm = (isWindows ? 'npm.cmd' : 'npm');
const lerna = (isWindows ? 'lerna.cmd' : 'lerna');

const cmds = [
  ['.', path.resolve(__dirname, './node_modules/.bin/' + lerna), 'bootstrap'],
  ['packages/jest-environment-jsdom', npm, 'link'],
  ['packages/jest-environment-node', npm, 'link'],
  ['packages/jest-haste-map', npm, 'link'],
  ['packages/jest-jasmine1', npm, 'link'],
  ['packages/jest-jasmine2', npm, 'link'],
  ['packages/jest-mock', npm, 'link'],
  ['packages/jest-util', npm, 'link'],
  ['.', npm, 'link jest-environment-jsdom'],
  ['.', npm, 'link jest-environment-node'],
  ['.', npm, 'link jest-haste-map'],
  ['.', npm, 'link jest-jasmine1'],
  ['.', npm, 'link jest-jasmine2'],
  ['.', npm, 'link jest-mock'],
  ['.', npm, 'link jest-util'],
];

cmds.forEach(commands => {
  execute.apply(null, commands);
});
