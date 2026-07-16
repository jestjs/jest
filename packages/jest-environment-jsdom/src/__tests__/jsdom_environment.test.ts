/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import JSDomEnvironment from '../';

describe('JSDomEnvironment', () => {
  it('should configure setTimeout/setInterval to use the browser api', () => {
    const env = new JSDomEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    env.fakeTimers!.useFakeTimers();

    const timer1 = env.global.setTimeout(() => {}, 0);
    const timer2 = env.global.setInterval(() => {}, 0);

    for (const timer of [timer1, timer2]) {
      expect(typeof timer).toBe('number');
    }
  });

  it('has modern fake timers implementation', () => {
    const env = new JSDomEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    expect(env.fakeTimersModern).toBeDefined();
  });

  it('should respect userAgent option', () => {
    const env = new JSDomEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig({
          testEnvironmentOptions: {
            userAgent: 'foo',
          },
        }),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    expect(env.dom.window.navigator.userAgent).toBe('foo');
  });

  it('should respect url option', () => {
    const env = new JSDomEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    expect(env.dom.window.location.href).toBe('http://localhost/');

    const envWithUrl = new JSDomEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig({
          testEnvironmentOptions: {
            url: 'https://jestjs.io',
          },
        }),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    expect(envWithUrl.dom.window.location.href).toBe('https://jestjs.io/');
  });

  /**
   * When used in conjunction with Custom Elements (part of the WebComponents standard)
   * setting the `global` and `global.document` to null too early is problematic because:
   *
   * CustomElement's disconnectedCallback method is called when a custom element
   * is removed from the DOM. The disconnectedCallback could need the document
   * in order to remove some listener for example.
   *
   * global.close calls jsdom's Window.js.close which does this._document.body.innerHTML = "".
   * The custom element will be removed from the DOM at this point, therefore disconnectedCallback
   * will be called, so please make sure the global.document is still available at this point.
   */
  it('should call CE disconnectedCallback with valid globals on teardown', () => {
    const env = new JSDomEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    let hasDisconnected = false;
    let documentWhenDisconnected = null;

    // define a custom element
    const {HTMLElement} = env.global;
    class MyCustomElement extends HTMLElement {
      disconnectedCallback() {
        hasDisconnected = true;
        documentWhenDisconnected = env.global.document;
      }
    }

    // append an instance of the custom element
    env.global.customElements.define('my-custom-element', MyCustomElement);
    const instance = env.global.document.createElement('my-custom-element');
    env.global.document.body.append(instance);

    // teardown will disconnect the custom elements
    env.teardown();

    expect(hasDisconnected).toBe(true);
    expect(documentWhenDisconnected).not.toBeNull();
  });

  it('should not fire load event after the environment was teared down', async () => {
    const env = new JSDomEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    const loadHandler = jest.fn();
    env.global.document.addEventListener('load', loadHandler);
    env.teardown();

    // The `load` event is fired in microtasks, wait until the microtask queue is reliably flushed
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(loadHandler).not.toHaveBeenCalled();
  });
});
