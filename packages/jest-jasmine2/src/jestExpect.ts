/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable local/prefer-spread-eventually */

import {jestExpect} from '@jest/expect';
import type {Global} from '@jest/types';
import type {JasmineMatchersObject} from './types';

export default function jestExpectAdapter(config: {expand: boolean}): void {
  (globalThis as Global.Global).expect = jestExpect;
  jestExpect.setState({expand: config.expand});

  const jasmine = (globalThis as Global.Global).jasmine;
  jasmine.anything = jestExpect.anything;
  jasmine.any = jestExpect.any;
  jasmine.objectContaining = jestExpect.objectContaining;
  jasmine.arrayContaining = jestExpect.arrayContaining;
  jasmine.stringMatching = jestExpect.stringMatching;

  jasmine.addMatchers = (jasmineMatchersObject: JasmineMatchersObject) => {
    const jestMatchersObject = Object.create(null);
    for (const name of Object.keys(jasmineMatchersObject)) {
      jestMatchersObject[name] = function (...args: Array<unknown>) {
        // use "expect.extend" if you need to use equality testers (via this.equal)
        const result = jasmineMatchersObject[name](null, null);
        // if there is no 'negativeCompare', both should be handled by `compare`
        const negativeCompare = result.negativeCompare || result.compare;

        return this.isNot
          ? negativeCompare.apply(null, args)
          : result.compare.apply(null, args);
      };
    }

    jestExpect.extend(jestMatchersObject);
  };
}
