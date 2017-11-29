/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');
const http = require('http');

it('expands a native module', () => {
  fs.expandingNativeObject = () => {
    console.log(global);
  };
});

it('expands the prototype of a native constructor', () => {
  http.ServerResponse.prototype.expandingNativePrototype = () => {
    console.log(global);
  };
});

it('adds listeners to process', () => {
  process.on('foo', () => {
    console.log(global);
  });
});
