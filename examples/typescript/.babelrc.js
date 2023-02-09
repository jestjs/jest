// Copyright (c) Meta Platforms, Inc. and affiliates., Inc. All rights reserved.

module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-typescript',
    ['@babel/preset-react', {runtime: 'automatic'}],
  ],
};
