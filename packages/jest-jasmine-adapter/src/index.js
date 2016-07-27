/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const {addMatchers} = require('jest-matchers');

// A single place to store everything jasmine related. (hacks, patches,
// backward compatibility functions, etc.)
const setup = () => {
  const jasmine = global.jasmine || require('jasmine');

  if (!global.jasmine) {
    global.jasmine = Object.create(null);
  }

  jasmine.addMatchers = makeAddMatchersFn(jasmine);
};

// Adapter function that replaces `jasmine.addMatchers` and make it
// add matchers to `jest-matchers` instead. This way existing custom
// matchers in www can still work without jasmine.
const makeAddMatchersFn = jasmine => {
  return jasmineMatchersObject => {
    const jestMatchersObject = {};

    Object.keys(jasmineMatchersObject).forEach(name => {
      jestMatchersObject[name] = function() {
        const jasmineMatcherResult = jasmineMatchersObject[name](
          jasmine.matchersUtil,
           // We don't have access to custom equality matchers
           // but it doesn't seem like this feature is used a lot anywhere
          null,
        );

        // if there is no 'negativeCompare', both should be handled by `compare`
        const negativeCompare =
          jasmineMatcherResult.negativeCompare || jasmineMatcherResult.compare;

        return this.isNot
          ? negativeCompare.apply(null, arguments)
          : jasmineMatcherResult.compare.apply(null, arguments);
      };
    });

    addMatchers(jestMatchersObject);
  };
};

module.exports = {
  setup,
};
