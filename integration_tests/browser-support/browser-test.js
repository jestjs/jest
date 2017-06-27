/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* eslint-disable */
var expect = require('../../packages/jest-matchers/build-es5/index.js');
var mock = require('../../packages/jest-mock/build-es5/index.js');

describe('es5 builds in browser', function() {
  it('runs assertions', function() {
    expect(1).toBe(1);
  });

  it('runs mocks', function() {
    var someMockFunction = mock.fn();
    expect(someMockFunction).not.toHaveBeenCalled();
    someMockFunction();
    expect(someMockFunction).toHaveBeenCalledTimes(1);
  });
});
