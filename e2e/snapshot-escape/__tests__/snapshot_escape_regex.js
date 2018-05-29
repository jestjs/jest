/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const regex = /\dd\ \s+ \w \\\[ \. blahzz.* [xyz]+/;

test('escape regex', () => expect(regex).toMatchSnapshot());

test('escape regex nested in object', () => {
  const objectContainingRegex = {regex};
  expect(objectContainingRegex).toMatchSnapshot();
});
