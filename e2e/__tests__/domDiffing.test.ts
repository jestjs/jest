/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {replaceSeed, replaceTime} from '../Utils';
import runJest from '../runJest';

test('should work without error', () => {
  const output = runJest('dom-diffing');
  expect(output.failed).toBe(true);
  expect(replaceSeed(replaceTime(output.stderr))).toMatchSnapshot();
});
