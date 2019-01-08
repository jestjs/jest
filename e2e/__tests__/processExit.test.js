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

it('prints stack trace pointing to process.exit call', async () => {
  const {stderr} = await runJest('process-exit');

  expect(stderr).toMatchSnapshot();
});
