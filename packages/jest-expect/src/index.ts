/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from 'expect';
import {
  addSerializer,
  toMatchInlineSnapshot,
  toMatchSnapshot,
  toThrowErrorMatchingInlineSnapshot,
  toThrowErrorMatchingSnapshot,
} from 'jest-snapshot';
import type {JestExpect} from './types';

export type {JestExpect} from './types';

export function createJestExpect(): JestExpect {
  const jestExpect = expect as JestExpect;

  jestExpect.extend({
    toMatchInlineSnapshot,
    toMatchSnapshot,
    toThrowErrorMatchingInlineSnapshot,
    toThrowErrorMatchingSnapshot,
  });

  jestExpect.addSnapshotSerializer = addSerializer;

  return jestExpect;
}

export const jestExpect = createJestExpect();
