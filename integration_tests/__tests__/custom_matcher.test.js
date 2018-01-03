/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

import {formatStackTrace} from 'jest-message-util';
import path from 'path';

const rootDir = path.resolve(__dirname, '..', '..');

const {makeProjectConfig} = require('../../test_utils');
const projectConfig = makeProjectConfig({rootDir});

function toCustomMatch(callback, expectation) {
  const actual = callback();

  if (actual !== expectation) {
    return {
      message: () => `Expected "${expectation}" but got "${actual}"`,
      pass: false,
    };
  } else {
    return {pass: true};
  }
}

expect.extend({
  toCustomMatch,
});

declare var expect: (any: any) => any;

describe('Custom matcher', () => {
  // This test is expected to pass
  it('passes', () => {
    expect(() => 'foo').toCustomMatch('foo');
  });

  // This test is expected to fail
  it('fails', () => {
    expect(() => {
      expect(() => 'foo').toCustomMatch('bar');
    }).toThrow();
  });

  // This test fails due to an unrelated/unexpected error
  // It will show a helpful stack trace though
  it('preserves error stack', () => {
    const foo = () => bar();
    const bar = () => baz();
    const baz = () => {
      throw Error('qux');
    };

    try {
      expect(() => {
        foo();
      }).toCustomMatch('test');
    } catch (error) {
      const stack = formatStackTrace(error.stack, projectConfig, {
        noStackTrace: false,
      });
      expect(stack).toMatchSnapshot();
    }
  });
});
