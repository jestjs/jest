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
        'babel-plugin-typescript-strip-namespaces',
        'babel-plugin-replace-ts-export-assignment',
        require.resolve(
          './scripts/babel-plugin-jest-replace-ts-require-assignment.js',
        ),
      ],
      presets: ['@babel/preset-typescript'],
      test: /\.tsx?$/,
    },
    // we want this file to keep `import()`, so exclude the transform for it
    {
      plugins: ['@babel/plugin-syntax-dynamic-import'],
      presets: [
        '@babel/preset-typescript',
        [
          '@babel/preset-env',
          {
            exclude: ['@babel/plugin-proposal-dynamic-import'],
            shippedProposals: true,
            targets: {node: supportedNodeVersion},
          },
        ],
      ],
      test: 'packages/jest-config/src/readConfigFileAndSetRootDir.ts',
    },
  ],
  plugins: [
    ['@babel/plugin-transform-modules-commonjs', {allowTopLevelThis: true}],
    '@babel/plugin-transform-strict-mode',
    '@babel/plugin-proposal-class-properties',
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        shippedProposals: true,
        targets: {node: supportedNodeVersion},
      },
    ],
  ],
};
