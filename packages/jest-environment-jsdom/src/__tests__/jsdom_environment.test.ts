/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeProjectConfig} from '@jest/test-utils';
import JSDomEnvironment = require('../');

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

  it('should respect userAgent option', () => {
    const env = new JSDomEnvironment(
      makeProjectConfig({
        testEnvironmentOptions: {
          userAgent: 'foo',
        },
      }),
    );

    expect(env.dom.window.navigator.userAgent).toEqual('foo');
  });

  /**
   * When used in conjunction with Custom Elements (part of the WebComponents standard)
   * setting the global.document to null too early is problematic because:
   *
   * CustomElement's disconnectedCallback method is called when a custom element
   * is removed from the DOM. The disconnectedCallback could need the document
   * in order to remove some listener for example.
   *
   * global.close calls jsdom's Window.js.close which does this._document.body.innerHTML = "".
   * The custom element will be removed from the DOM at this point, therefore disconnectedCallback
   * will be called, so please make sure the global.document is still available at this point.
   */
  it('should not set the global.document to null too early', () => {
    const env = new JSDomEnvironment(makeProjectConfig());

    const originalCloseFn = env.global.close.bind(env.global);
    env.global.close = () => {
      originalCloseFn();
      expect(env.global.document).not.toBeNull();
    };

    return env.teardown();
  });
});
