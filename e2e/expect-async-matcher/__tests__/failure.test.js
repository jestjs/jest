/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {toHaveLengthAsync} from '../matchers';

expect.extend({toHaveLengthAsync});

it('fail with expected non promise values', () =>
  expect([1]).toHaveLengthAsync(Promise.resolve(2)));

it('fail with expected non promise values and not', () =>
  expect([1, 2]).not.toHaveLengthAsync(Promise.resolve(2)));

it('fail with expected promise values', () =>
  expect(Promise.resolve([1])).resolves.toHaveLengthAsync(Promise.resolve(2)));

it('fail with expected promise values and not', () =>
  expect(Promise.resolve([1, 2])).resolves.not.toHaveLengthAsync(
    Promise.resolve(2),
  ));
