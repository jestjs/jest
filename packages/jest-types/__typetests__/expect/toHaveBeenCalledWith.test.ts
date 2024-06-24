/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from 'tstyche';
import {jest, expect as jestExpect} from '@jest/globals';

expect(
  jestExpect(jest.fn()).toHaveBeenCalledWith(jestExpect.anything()),
).type.toBeVoid();
expect(
  jestExpect(jest.fn()).toHaveBeenCalledWith(jestExpect.anything(true)),
).type.toRaiseError();

expect(jestExpect(jest.fn()).toHaveBeenCalledWith()).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveBeenCalledWith(123)).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveBeenCalledWith('value')).type.toBeVoid();
expect(
  jestExpect(jest.fn()).toHaveBeenCalledWith(123, 'value'),
).type.toBeVoid();
expect(
  jestExpect(jest.fn()).toHaveBeenCalledWith('value', 123),
).type.toBeVoid();
expect(
  jestExpect(jest.fn<(a: string, b: number) => void>()).toHaveBeenCalledWith(
    jestExpect.stringContaining('value'),
    123,
  ),
).type.toBeVoid();
