/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import bar from 'data:application/json,{"obj": 456}';
import {foo} from 'data:text/javascript,export const foo = "123"';

export function value() {
  return {bar, foo};
}
