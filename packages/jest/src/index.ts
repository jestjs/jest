/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config as ConfigTypes} from '@jest/types';

export {
  SearchSource,
  createTestScheduler,
  getVersion,
  runCLI,
} from '@jest/core';

export {run} from 'jest-cli';

export type Config = ConfigTypes.InitialOptions;

declare global {
  export const beforeEach: typeof import('@jest/globals')['beforeEach'];
  export const beforeAll: typeof import('@jest/globals')['beforeAll'];

  export const afterEach: typeof import('@jest/globals')['afterEach'];
  export const afterAll: typeof import('@jest/globals')['afterAll'];

  export const describe: typeof import('@jest/globals')['describe'];
  export const fdescribe: typeof import('@jest/globals')['fdescribe'];
  export const xdescribe: typeof import('@jest/globals')['xdescribe'];

  export const test: typeof import('@jest/globals')['test'];
  export const xtest: typeof import('@jest/globals')['xtest'];

  export const it: typeof import('@jest/globals')['it'];
  export const fit: typeof import('@jest/globals')['fit'];
  export const xit: typeof import('@jest/globals')['xit'];

  export const expect: typeof import('@jest/globals')['expect'];

  export const jest: typeof import('@jest/globals')['jest'];
}
