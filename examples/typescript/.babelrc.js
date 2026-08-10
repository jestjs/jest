// Copyright (c) Meta Platforms, Inc. and affiliates.

module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-typescript',
    ['@babel/preset-react', {runtime: 'automatic'}],
  ],
};
