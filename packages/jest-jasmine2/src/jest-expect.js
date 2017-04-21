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

import type {Config} from 'types/Config';
import type {RawMatcherFn} from 'types/Matchers';

const expect = require('jest-matchers');

const {
  addSerializer,
  toMatchSnapshot,
  toThrowErrorMatchingSnapshot,
} = require('jest-snapshot');

type JasmineMatcher = {
  (): JasmineMatcher,
  compare: () => RawMatcherFn,
  negativeCompare: () => RawMatcherFn,
};
type JasmineMatchersObject = {[id: string]: JasmineMatcher};

module.exports = (config: Config) => {
  global.expect = expect;
  expect.setState({
    expand: config.expand,
  });
  expect.extend({toMatchSnapshot, toThrowErrorMatchingSnapshot});

  expect.addSnapshotSerializer = addSerializer;

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
        const result = jasmineMatchersObject[name](jasmine.matchersUtil, null);
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
