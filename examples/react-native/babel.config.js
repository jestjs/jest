// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

const {createRequire} = require('module');

const rnRequire = createRequire(require.resolve('react-native'));

module.exports = {
  // RN bundles this preset, so let's load it instead of depending on it ourselves
  presets: [rnRequire.resolve('metro-react-native-babel-preset')],
};
