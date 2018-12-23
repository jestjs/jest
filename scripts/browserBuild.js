/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
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

const transformOptions = require('../babel.config.js');

const babelEs5Options = {
  // Dont load other config files
  babelrc: false,
  configFile: false,
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  overrides: transformOptions.overrides,
  plugins: [
    '@babel/plugin-transform-strict-mode',
    '@babel/plugin-external-helpers',
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        shippedProposals: true,
        // Target ES5
        targets: 'IE 11',
      },
    ],
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
      // strip types
      rollupBabel({
        babelrc: false,
        configFile: false,
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        overrides: transformOptions.overrides,
      }),
      rollupCommonjs(),
      rollupJson(),
      rollupBabel(babelEs5Options),
      rollupGlobals(),
      rollupBuiltins(),
      rollupResolve({extensions: ['.js', '.jsx', '.ts', '.tsx']}),
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
