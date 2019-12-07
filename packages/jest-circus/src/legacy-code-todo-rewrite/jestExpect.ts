/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect = require('expect');

import {
  addSerializer,
  toMatchInlineSnapshot,
  toMatchSnapshot,
  toThrowErrorMatchingInlineSnapshot,
  toThrowErrorMatchingSnapshot,
} from 'jest-snapshot';

export default (config: {
  expand: boolean;
  ignoreAsymmetricMatches: boolean;
}) => {
  global.expect = expect;
  expect.setState({
    expand: config.expand,
    ignoreAsymmetricMatches: config.ignoreAsymmetricMatches,
  });
  expect.extend({
    toMatchInlineSnapshot,
    toMatchSnapshot,
    toThrowErrorMatchingInlineSnapshot,
    toThrowErrorMatchingSnapshot,
  });

  expect.addSnapshotSerializer = addSerializer;
};
