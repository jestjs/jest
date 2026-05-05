/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import BaseJSDOMEnvironment from '..';
import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from '@jest/environment';
import * as jsdomModule from 'jsdom';
import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';

class CustomJSDOMEnvironment extends BaseJSDOMEnvironment {
  constructor(
    public config: JestEnvironmentConfig,
    public context: EnvironmentContext,
  ) {
    super(config, context, jsdomModule);
  }
}

describe('JSDomEnvironment abstract', () => {
  it('should work with custom jsdom version <= 26', () => {
    Object.defineProperty(jsdomModule.VirtualConsole.prototype, 'sendTo', {
      value: jest.fn(),
      writable: true,
    });
    Object.defineProperty(jsdomModule.VirtualConsole.prototype, 'forwardTo', {
      value: undefined,
      writable: true,
    });
    const env = new CustomJSDOMEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    expect(env.dom).toBeDefined();
  });

  it('should work with custom jsdom version >= 27', () => {
    Object.defineProperty(jsdomModule.VirtualConsole.prototype, 'sendTo', {
      value: undefined,
      writable: true,
    });
    Object.defineProperty(jsdomModule.VirtualConsole.prototype, 'forwardTo', {
      value: jest.fn(),
      writable: true,
    });
    const env = new CustomJSDOMEnvironment(
      {
        globalConfig: makeGlobalConfig(),
        projectConfig: makeProjectConfig(),
      },
      {console, docblockPragmas: {}, testPath: __filename},
    );

    expect(env.dom).toBeDefined();
  });
});
