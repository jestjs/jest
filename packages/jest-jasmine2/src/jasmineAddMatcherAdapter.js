/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

import type {
  RawMatcherFn,
  MatchersObject,
} from 'jest-matchers';

type JamineMatcher = {
  compare: RawMatcherFn,
  negativeCompare: ?RawMatcherFn,
};
type JasmineMatcherObject = {
  [id:string]: JasmineMatcher,
};

module.exports = jasmine => {
  jasmine.addMatchers = (jasmineMatchersObject:JasmineMatchersObject) => {
    const jestMatchersObject:MatchersObject = Object.create(null);

    Object.keys(jasmineMatchersObject).forEach(name => {
      jestMatchersObject[name] = function aliasedMatcher() : RawMatcherFn => {
        const jasmineMatcherResult:JasmineMatcher = jasmineMatchersObject[name](
          jasmine.matchersUtil,
           // We don't have access to custom equality matchers
           // but it doesn't seem like this feature is used a lot anywhere
          null,
        );

        // if there is no 'negativeCompare', both should be handled by `compare`
        const negativeCompare:RawMatcherFn =
          jasmineMatcherResult.negativeCompare || jasmineMatcherResult.compare;

        return this.isNot
          ? negativeCompare.apply(null, arguments)
          : jasmineMatcherResult.compare.apply(null, arguments);
      };
    });

    expect.extend(jestMatchersObject);
  };
};
