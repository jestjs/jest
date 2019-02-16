/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect, {RawMatcherFn} from 'expect';

import {
  addSerializer,
  toMatchSnapshot,
  toMatchInlineSnapshot,
  toThrowErrorMatchingSnapshot,
  toThrowErrorMatchingInlineSnapshot,
} from 'jest-snapshot';

// @ts-ignore
type JasmineMatcher = {
  (): JasmineMatcher;
  compare: () => RawMatcherFn;
  negativeCompare: () => RawMatcherFn;
};

export default (config: {expand: boolean}) => {
  global.expect = expect;
  expect.setState({
    expand: config.expand,
  });
  expect.extend({
    toMatchInlineSnapshot,
    toMatchSnapshot,
    toThrowErrorMatchingInlineSnapshot,
    toThrowErrorMatchingSnapshot,
  });

  (expect as Object).addSnapshotSerializer = addSerializer;
};
