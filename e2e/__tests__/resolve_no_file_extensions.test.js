/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

import runJest from '../runJest';
import {extractSummary} from '../Utils';

test('show error message with matching files', () => {
  const {status, stderr} = runJest('resolve_no_extensions');
  const {rest} = extractSummary(stderr);

  expect(status).toBe(1);
  expect(rest).toMatchSnapshot();
});
