// Copyright (c) Meta Platforms, Inc. and affiliates.

const {createRequire} = require('module');

const rnRequire = createRequire(require.resolve('react-native'));

module.exports = {
  // RN bundles this preset, so let's load it instead of depending on it ourselves
  presets: [rnRequire.resolve('@react-native/babel-preset')],
};
