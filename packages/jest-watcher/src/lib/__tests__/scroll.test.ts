/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import scroll from '../scroll';

it('When offset is -1', () => {
  expect(scroll(25, {max: 10, offset: -1})).toEqual({
    end: 10,
    index: -1,
    start: 0,
  });
});

it('When offset is in the first set of items', () => {
  expect(scroll(25, {max: 10, offset: 4})).toEqual({
    end: 10,
    index: 4,
    start: 0,
  });

  expect(scroll(25, {max: 10, offset: 6})).toEqual({
    end: 10,
    index: 6,
    start: 0,
  });
});

it('When offset is in the middle of the list', () => {
  expect(scroll(25, {max: 10, offset: 7})).toEqual({
    end: 11,
    index: 6,
    start: 1,
  });

  expect(scroll(25, {max: 10, offset: 14})).toEqual({
    end: 18,
    index: 6,
    start: 8,
  });
});

it('When offset is at the end of the list', () => {
  expect(scroll(25, {max: 10, offset: 23})).toEqual({
    end: 25,
    index: 8,
    start: 15,
  });

  expect(scroll(25, {max: 10, offset: 25})).toEqual({
    end: 25,
    index: 10,
    start: 15,
  });

  expect(scroll(25, {max: 10, offset: 35})).toEqual({
    end: 25,
    index: 10,
    start: 15,
  });
});

it('When offset is at the end and size is smaller than max', () => {
  expect(scroll(8, {max: 10, offset: 6})).toEqual({
    end: 8,
    index: 6,
    start: 0,
  });

  expect(scroll(5, {max: 6, offset: 4})).toEqual({
    end: 5,
    index: 4,
    start: 0,
  });
});
