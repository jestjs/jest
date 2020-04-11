/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {wrap} from 'jest-snapshot-serializer-raw';
import runJest from '../runJest';

describe('Correct BeforeAll run', () => {
  it('ensures the BeforeAll of ignored suite is not run', () => {
    let {stdout} = runJest('before-all-filtered');

    // for some reason Circus does not have the `Object` part
    stdout = stdout.replace(/at Object.log \(/g, 'at log (');

    expect(wrap(stdout)).toMatchSnapshot();
  });
});
