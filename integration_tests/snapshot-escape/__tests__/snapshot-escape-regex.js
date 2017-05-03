/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const regex = /\dd\ \s+ \w \\\[ \. blahzz.* [xyz]+/;

test('escape regex', () => expect(regex).toMatchSnapshot());

test('escape regex nested in object', () => {
  const objectContainingRegex = {regex};
  expect(objectContainingRegex).toMatchSnapshot();
});
