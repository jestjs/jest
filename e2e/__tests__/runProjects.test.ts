/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';

import {RunJestJsonResult, json as runWithJson} from '../runJest';

const dir = resolve(__dirname, '..', 'run-projects');

describe('when Jest is started with `--runProjects first-project`', () => {
  let result: RunJestJsonResult;
  beforeAll(() => {
    result = runWithJson('run-projects', [`--runProjects`, 'first-project']);
  });
  it('runs the tests in the first project only', () => {
    expect(result.json.success).toBe(true);
    expect(result.json.numTotalTests).toBe(1);
    expect(result.json.testResults.map(({name}) => name)).toEqual([
      resolve(dir, '__tests__/first-project.test.js'),
    ]);
  });
  it('prints that only first-project will run', () => {
    expect(result.stderr).toMatch(/^Will run one project: first-project/);
  });
});

describe('when Jest is started with `--runProjects second-project`', () => {
  let result: RunJestJsonResult;
  beforeAll(() => {
    result = runWithJson('run-projects', [`--runProjects`, 'second-project']);
  });
  it('runs the tests in the second project only', () => {
    expect(result.json.success).toBe(true);
    expect(result.json.numTotalTests).toBe(1);
    expect(result.json.testResults.map(({name}) => name)).toEqual([
      resolve(dir, '__tests__/second-project.test.js'),
    ]);
  });
  it('prints that only second-project will run', () => {
    expect(result.stderr).toMatch(/^Will run one project: second-project/);
  });
});

describe('when Jest is started with `--runProjects first-project second-project`', () => {
  let result: RunJestJsonResult;
  beforeAll(() => {
    result = runWithJson('run-projects', [
      `--runProjects`,
      'first-project',
      'second-project',
    ]);
  });
  it('runs the tests in the first and second projects', () => {
    expect(result.json.success).toBe(true);
    expect(result.json.numTotalTests).toBe(2);
    expect(result.json.testResults.map(({name}) => name).sort()).toEqual([
      resolve(dir, '__tests__/first-project.test.js'),
      resolve(dir, '__tests__/second-project.test.js'),
    ]);
  });
  it('prints that both first-project and second-project will run', () => {
    expect(result.stderr).toMatch(
      /^Will run 2 projects:\n- first-project\n- second-project/,
    );
  });
});

describe('when Jest is started without providing `--runProjects`', () => {
  let result: RunJestJsonResult;
  beforeAll(() => {
    result = runWithJson('run-projects', []);
  });
  it('runs the tests in the first and second projects', () => {
    expect(result.json.success).toBe(true);
    expect(result.json.numTotalTests).toBe(2);
    expect(result.json.testResults.map(({name}) => name).sort()).toEqual([
      resolve(dir, '__tests__/first-project.test.js'),
      resolve(dir, '__tests__/second-project.test.js'),
    ]);
  });
  it('does not print which projects are run', () => {
    expect(result.stderr).not.toMatch(/^Will run/);
  });
});
