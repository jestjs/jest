/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const value = 'abc';

function covered() {
  console.log('this will print');
}

function uncovered() {
  console.log('this will not');
}

if (value !== 'abc') {
  uncovered();
}

covered();

export {value};
