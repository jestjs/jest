/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('default reporter prints compact message', () => {
  const {stdout, stderr} = runJest('default-reporter', [
    '--verbose=false',
    '--config',
    JSON.stringify({
      reporters: [['default', {compact: true}]],
    }),
  ]);
  expect(stdout).toMatchSnapshot();
  expect(extractSummary(stderr).rest).toMatchSnapshot();
});
