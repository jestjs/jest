/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function addOne(inputNumber) {
  return ++inputNumber;
}

function isEven(inputNumber) {
  if (inputNumber % 2 === 0) {
    return true;
  } else {
    return false;
  }
}

function notCovered() {
  return 'not covered';
}

/* global inputObject */
if (inputObject.number / 1 === inputObject.number) {
  isEven(addOne(inputObject.number));
}
