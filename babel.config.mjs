/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createRequire} from 'module';
import path from 'path';
import {fileURLToPath} from 'url';
import semver from 'semver';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const supportedNodeVersion = semver.minVersion(pkg.engines.node).version;
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  babelrcRoots: ['examples/*'],
  // we don't wanna run the transforms in this file over react native
  exclude: /react-native/,
  overrides: [
    {
      plugins: [
        path.resolve(
          dirname,
          'scripts/babel-plugin-jest-replace-ts-require-assignment.mjs',
        ),
      ],
      presets: [
        [
          '@babel/preset-typescript',
          {
            // will be the default in Babel 8, so let's just turn it on now
            allowDeclareFields: true,
            // will be default in the future, but we don't want to use it
            allowNamespaces: false,
          },
        ],
      ],
      test: /\.tsx?$/,
    },
  ],
  plugins: [
    ['@babel/plugin-transform-modules-commonjs', {allowTopLevelThis: true}],
    path.resolve(dirname, 'scripts/babel-plugin-jest-require-outside-vm.mjs'),
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        bugfixes: true,
        // we manually include the CJS plugin above, so let's make preset-env do less work
        modules: false,
        shippedProposals: true,
        targets: {node: supportedNodeVersion},
      },
    ],
  ],
};
