/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const jasmineCheck = require('jasmine-check');

module.exports = (global, configOptions) => {
  jasmineCheck.install(global);

  const check = global.check;
  const gen = global.gen;
  delete global.check;
  delete global.gen;

  const makeMergeOptions = (object, methodName) => {
    const original = object[methodName];
    object[methodName] = (specName, options, gens, propertyFn) => {
      if (!propertyFn) {
        propertyFn = gens;
        gens = options;
        options = {};
      }
      const mergedOptions = Object.assign({}, configOptions, options);
      return original(specName, mergedOptions, gens, propertyFn);
    };
  };

  makeMergeOptions(check, 'it');
  makeMergeOptions(check, 'iit');
  makeMergeOptions(check.it, 'only');
  makeMergeOptions(check, 'fit');
  makeMergeOptions(check, 'xit');
  return {check, gen};
};
