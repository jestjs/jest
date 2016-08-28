/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const jestExpect = require('jest-matchers').expect;

const jasmineExpect = global.expect;

console.log(jasmine.Spec);

// extend jasmine matchers with `jest-matchers`
module.exports = matchersContext => {
  global.expect = actual => {
    const jasmineMatchers = jasmineExpect(actual);
    const jestMatchers = jestExpect(actual, matchersContext);
    const not = Object.assign(jasmineMatchers.not, jestMatchers.not);
    return Object.assign(jasmineMatchers, jestMatchers, {not});
  };
};
