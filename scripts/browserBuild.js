/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const path = require('path');
const rollup = require('rollup').rollup;
const rollupResolve = require('rollup-plugin-node-resolve');
const rollupCommonjs = require('rollup-plugin-commonjs');
const rollupBuiltins = require('rollup-plugin-node-builtins');
const rollupGlobals = require('rollup-plugin-node-globals');
const rollupJson = require('rollup-plugin-json');
const rollupBabel = require('rollup-plugin-babel');
const rollupFlow = require('rollup-plugin-flow');

const babelEs5Options = {
  // Dont load other config files
  babelrc: false,
  configFile: false,
  plugins: [
    '@babel/plugin-transform-strict-mode',
    '@babel/plugin-external-helpers',
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        // Required for Rollup
        modules: false,
        shippedProposals: true,
        // Target ES5
        targets: 'IE 11',
      },
    ],
    '@babel/preset-flow',
  ],
  runtimeHelpers: true,
};

function browserBuild(pkgName, entryPath, destination) {
  return rollup({
    entry: entryPath,
    onwarn: () => {},
    plugins: [
      {
        resolveId(id) {
          return id === 'chalk'
            ? path.resolve(__dirname, '../packages/expect/build/fakeChalk.js')
            : undefined;
        },
      },
      rollupFlow(),
      rollupJson(),
      rollupCommonjs(),
      rollupBabel(babelEs5Options),
      rollupGlobals(),
      rollupBuiltins(),
      rollupResolve(),
    ],
    strict: false,
  }).then(bundle =>
    bundle.write({
      file: destination,
      format: 'umd',
      name: pkgName,
    })
  );
}

module.exports = browserBuild;
