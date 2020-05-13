/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import NodeEnvironment = require('../');
import {makeProjectConfig} from '../../../../TestUtils';

const isTextEncoderDefined = typeof TextEncoder === 'function';

describe('NodeEnvironment', () => {
  it('uses a copy of the process object', () => {
    const env1 = new NodeEnvironment(makeProjectConfig());
    const env2 = new NodeEnvironment(makeProjectConfig());

    expect(env1.global.process).not.toBe(env2.global.process);
  });

  it('exposes process.on', () => {
    const env1 = new NodeEnvironment(makeProjectConfig());

    expect(env1.global.process.on).not.toBe(null);
  });

  it('exposes global.global', () => {
    const env1 = new NodeEnvironment(makeProjectConfig());

    expect(env1.global.global).toBe(env1.global);
  });

  it('should configure setTimeout/setInterval to use the node api', () => {
    const env1 = new NodeEnvironment(makeProjectConfig());

    env1.fakeTimers!.useFakeTimers();

    const timer1 = env1.global.setTimeout(() => {}, 0);
    const timer2 = env1.global.setInterval(() => {}, 0);

    [timer1, timer2].forEach(timer => {
      // @ts-expect-error
      expect(timer.id).not.toBeUndefined();
      expect(typeof timer.ref).toBe('function');
      expect(typeof timer.unref).toBe('function');
    });
  });

  it('has modern fake timers implementation', () => {
    const env = new NodeEnvironment(makeProjectConfig());

    expect(env.fakeTimersModern).toBeDefined();
  });

  if (isTextEncoderDefined) {
    test('TextEncoder references the same global Uint8Array constructor', () => {
      expect(new TextEncoder().encode('abc')).toBeInstanceOf(Uint8Array);
    });
  }
});
