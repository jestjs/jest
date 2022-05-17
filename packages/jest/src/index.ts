/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export {
  SearchSource,
  createTestScheduler,
  getVersion,
  runCLI,
} from '@jest/core';

export {run} from 'jest-cli';

declare global {
  const beforeEach: typeof import('@jest/globals')['beforeEach'];
  const beforeAll: typeof import('@jest/globals')['beforeAll'];

  const afterEach: typeof import('@jest/globals')['afterEach'];
  const afterAll: typeof import('@jest/globals')['afterAll'];

  const describe: typeof import('@jest/globals')['describe'];
  const fdescribe: typeof import('@jest/globals')['fdescribe'];
  const xdescribe: typeof import('@jest/globals')['xdescribe'];

  const test: typeof import('@jest/globals')['test'];
  const xtest: typeof import('@jest/globals')['xtest'];

  const it: typeof import('@jest/globals')['it'];
  const fit: typeof import('@jest/globals')['fit'];
  const xit: typeof import('@jest/globals')['xit'];

  const expect: typeof import('@jest/globals')['expect'];

  const jest: typeof import('@jest/globals')['jest'];
}
