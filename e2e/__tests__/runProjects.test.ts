/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';

import {json as runWithJson} from '../runJest';

const dir = resolve(__dirname, '..', 'run-projects');

test('run first project when runProjects is [first-project]', () => {
  const {json} = runWithJson('run-projects', [
    `--runProjects`,
    'first-project',
  ]);
  expect(json.success).toBe(true);
  expect(json.numTotalTests).toBe(1);
  expect(json.testResults.map(({name}) => name)).toEqual([
    resolve(dir, '__tests__/first-project.test.js'),
  ]);
});

test('run second project when runProjects is [second-project]', () => {
  const {json} = runWithJson('run-projects', [
    '--runProjects',
    'second-project',
  ]);
  expect(json.success).toBe(true);
  expect(json.numTotalTests).toBe(1);
  expect(json.testResults.map(({name}) => name)).toEqual([
    resolve(dir, '__tests__/second-project.test.js'),
  ]);
});

test('run first and second project when runProjects is [first-project, second-project]', () => {
  const {json} = runWithJson('run-projects', [
    '--runProjects',
    'first-project',
    'second-project',
  ]);
  expect(json.success).toBe(true);
  expect(json.numTotalTests).toBe(2);
  expect(json.testResults.map(({name}) => name).sort()).toEqual([
    resolve(dir, '__tests__/first-project.test.js'),
    resolve(dir, '__tests__/second-project.test.js'),
  ]);
});

test('run first and second project when runProjects is not specified', () => {
  const {json} = runWithJson('run-projects', []);
  expect(json.success).toBe(true);
  expect(json.numTotalTests).toBe(2);
  expect(json.testResults.map(({name}) => name).sort()).toEqual([
    resolve(dir, '__tests__/first-project.test.js'),
    resolve(dir, '__tests__/second-project.test.js'),
  ]);
});
