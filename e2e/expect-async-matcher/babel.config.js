// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

const baseConfig = require('../../babel.config');

module.exports = Object.assign({}, baseConfig, {
  presets: baseConfig.presets.concat('@babel/preset-flow'),
});
