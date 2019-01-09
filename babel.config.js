// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

module.exports = {
  babelrcRoots: ['examples/*'],
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
