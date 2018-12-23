// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

module.exports = {
  babelrcRoots: ['examples/*'],
  overrides: [
    {
      presets: ['@babel/preset-flow'],
      test: '**/*.js',
    },
    {
      presets: ['@babel/preset-typescript'],
      test: '**/*.ts',
    },
  ],
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
  ],
};
