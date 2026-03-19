/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


import {_getError} from '../utils';

test('handles plain object error with undefined asyncError', () => {
  const errors = [{status: 403, message: 'Forbidden'}, undefined] as any;

  const result = _getError(errors);

  expect(result).toBeInstanceOf(Error);
  expect(result.message).toContain('Forbidden');
});