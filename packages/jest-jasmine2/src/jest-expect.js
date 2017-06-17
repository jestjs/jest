/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {RawMatcherFn} from 'types/Matchers';

import expect from 'jest-matchers';
import {
  addSerializer,
  toMatchSnapshot,
  toThrowErrorMatchingSnapshot,
} from 'jest-snapshot';

type JasmineMatcher = {
  (matchersUtil: any, context: any): JasmineMatcher,
  compare: () => RawMatcherFn,
  negativeCompare: () => RawMatcherFn,
};
type JasmineMatchersObject = {[id: string]: JasmineMatcher};

module.exports = (config: {expand: boolean}) => {
  global.expect = expect;
  expect.setState({expand: config.expand});
  expect.extend({toMatchSnapshot, toThrowErrorMatchingSnapshot});
  (expect: Object).addSnapshotSerializer = addSerializer;

  const jasmine = global.jasmine;
  jasmine.anything = expect.anything;
  jasmine.any = expect.any;
  jasmine.objectContaining = expect.objectContaining;
  jasmine.arrayContaining = expect.arrayContaining;
  jasmine.stringMatching = expect.stringMatching;

  jasmine.addMatchers = (jasmineMatchersObject: JasmineMatchersObject) => {
    const jestMatchersObject = Object.create(null);
    Object.keys(jasmineMatchersObject).forEach(name => {
      jestMatchersObject[name] = function(): RawMatcherFn {
        // use "expect.extend" if you need to use equality testers (via this.equal)
        const result = jasmineMatchersObject[name](null, null);
        // if there is no 'negativeCompare', both should be handled by `compare`
        const negativeCompare = result.negativeCompare || result.compare;

        return this.isNot
          ? negativeCompare.apply(null, arguments)
          : result.compare.apply(null, arguments);
      };
    });

    const expect = global.expect;
    expect.extend(jestMatchersObject);
  };
};
