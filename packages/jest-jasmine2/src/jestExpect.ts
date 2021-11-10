/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable local/prefer-spread-eventually */

import type {Expect, Global} from '@jest/types';
import expect = require('expect');
import {
  addSerializer,
  toMatchInlineSnapshot,
  toMatchSnapshot,
  toThrowErrorMatchingInlineSnapshot,
  toThrowErrorMatchingSnapshot,
} from 'jest-snapshot';
import type {Jasmine, JasmineMatchersObject} from './types';

declare const global: Global.Global;

export default (config: {expand: boolean}): void => {
  const jestExpect = expect as Expect.JestExpect;

  global.expect = jestExpect;
  jestExpect.setState({expand: config.expand});
  jestExpect.extend({
    toMatchInlineSnapshot,
    toMatchSnapshot,
    toThrowErrorMatchingInlineSnapshot,
    toThrowErrorMatchingSnapshot,
  });
  jestExpect.addSnapshotSerializer = addSerializer;

  const jasmine = global.jasmine as Jasmine;
  jasmine.anything = jestExpect.anything;
  jasmine.any = jestExpect.any;
  jasmine.objectContaining = jestExpect.objectContaining;
  jasmine.arrayContaining = jestExpect.arrayContaining;
  jasmine.stringMatching = jestExpect.stringMatching;

  jasmine.addMatchers = (jasmineMatchersObject: JasmineMatchersObject) => {
    const jestMatchersObject = Object.create(null);
    Object.keys(jasmineMatchersObject).forEach(name => {
      jestMatchersObject[name] = function (
        this: Expect.MatcherState,
        ...args: Array<unknown>
      ): Expect.RawMatcherFn {
        // use "expect.extend" if you need to use equality testers (via this.equal)
        const result = jasmineMatchersObject[name](null, null);
        // if there is no 'negativeCompare', both should be handled by `compare`
        const negativeCompare = result.negativeCompare || result.compare;

        return this.isNot
          ? negativeCompare.apply(
              null,
              // @ts-expect-error
              args,
            )
          : result.compare.apply(
              null,
              // @ts-expect-error
              args,
            );
      };
    });

    jestExpect.extend(jestMatchersObject);
  };
};
