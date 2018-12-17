// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

module.exports = {
  babelrcRoots: ['.', 'packages/*', 'examples/*'],
  plugins: [
    ['@babel/plugin-transform-modules-commonjs', {allowTopLevelThis: true}],
    '@babel/plugin-transform-strict-mode',
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        shippedProposals: true,
        targets: {node: 6},
      },
    ],
    '@babel/preset-flow',
  ],
};
