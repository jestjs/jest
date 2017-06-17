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

export type ScrollOptions = {
  offset: number,
  max: number,
};

const scroll = (size: number, {offset, max}: ScrollOptions) => {
  let start = 0;
  let index = Math.min(offset, size);

  const halfScreen = max / 2;

  if (index <= halfScreen) {
    start = 0;
  } else {
    if (size >= max) {
      start = Math.min(index - halfScreen - 1, size - max);
    }
    index = Math.min(index - start, size);
  }

  return {
    end: Math.min(size, start + max),
    index,
    start,
  };
};

module.exports = scroll;
