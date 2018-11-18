// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

const {
  default: defaultResolver,
} = require('jest-resolve/build/defaultResolver');

const exportedModules = new Map([
  ['foo', 'foo'],
  ['bar', 'bar'],
  ['regenerator-runtime/runtime', 'fake-regenerator'],
]);

module.exports = (name, options) => {
  const resolution = exportedModules.get(name);

  if (resolution) {
    return `${__dirname}/${resolution}.js`;
  } else {
    return defaultResolver(name, options);
  }
};
