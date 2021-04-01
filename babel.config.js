/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const semver = require('semver');
const pkg = require('./package.json');

const supportedNodeVersion = semver.minVersion(pkg.engines.node).version;

module.exports = {
  babelrcRoots: ['examples/*'],
  // we don't wanna run the transforms in this file over react native
  exclude: /react-native/,
  overrides: [
    {
      plugins: [
        'babel-plugin-replace-ts-export-assignment',
        require.resolve(
          './scripts/babel-plugin-jest-replace-ts-require-assignment.js',
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
    '@babel/plugin-proposal-class-properties',
    require.resolve('./scripts/babel-plugin-jest-require-outside-vm'),
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        bugfixes: true,
        // a runtime error is preferable, and we need a real `import`
        exclude: ['@babel/plugin-proposal-dynamic-import'],
        shippedProposals: true,
        targets: {node: supportedNodeVersion},
      },
    ],
  ],
};
