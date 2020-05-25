/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import JSDomEnvironment = require('../');
import {makeProjectConfig} from '../../../../TestUtils';

describe('JSDomEnvironment', () => {
  it('should configure setTimeout/setInterval to use the browser api', () => {
    const env = new JSDomEnvironment(makeProjectConfig());

    env.fakeTimers!.useFakeTimers();

    const timer1 = env.global.setTimeout(() => {}, 0);
    const timer2 = env.global.setInterval(() => {}, 0);

    [timer1, timer2].forEach(timer => {
      expect(typeof timer).toBe('number');
    });
  });

  it('has modern fake timers implementation', () => {
    const env = new JSDomEnvironment(makeProjectConfig());

    expect(env.fakeTimersModern).toBeDefined();
  });
});
