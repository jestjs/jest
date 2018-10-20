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

test('works with custom matchers', () => {
  const {stderr} = runJest('custom-matcher-stack-trace');

  let {rest} = extractSummary(stderr);

  rest = rest
    .split('\n')
    .filter(line => line.indexOf('at Error (native)') < 0)
    .join('\n');

  expect(rest).toMatchSnapshot();
});
