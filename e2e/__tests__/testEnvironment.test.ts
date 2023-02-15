/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import slash = require('slash');
import {cleanup, createEmptyPackage, writeFiles} from '../Utils';
import runJest, {json as runWithJson} from '../runJest';
import * as testFixturePackage from '../test-environment/package.json';

const DIR = path.resolve(tmpdir(), 'test-env-no-mocked');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

it('respects testEnvironment docblock', () => {
  expect(testFixturePackage.jest.testEnvironment).toBe('node');

  const {json: result} = runWithJson('test-environment');

  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(4);
});

it('handles missing `mocked` property', () => {
  createEmptyPackage(DIR);
  writeFiles(DIR, {
    'env.js': `
      const Node = require('${slash(
        require.resolve('jest-environment-node'),
      )}').default;

      module.exports = class Thing extends Node {
        constructor(...args) {
          super(...args);

          this.moduleMocker.mocked = undefined;
        }
      };
    `,
    'test.js': `
      /**
       * @jest-environment ./env.js
       */

      jest.mocked();

      test('halla', () => {
        expect(globalThis.thing).toBe('nope');
      });
    `,
  });

  const {exitCode, stderr} = runJest(DIR);

  expect(exitCode).toBe(1);
  expect(stderr).toContain(
    'Your test environment does not support `mocked`, please update it.',
  );
});
