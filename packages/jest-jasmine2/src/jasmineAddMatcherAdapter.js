/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

module.exports = jasmine => {
  jasmine.addMatchers = function addMatcherAlias(jasmineMatchersObject) {
    const jestMatchersObject = Object.create(null);

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

    expect.extend(jestMatchersObject);
  };

};
