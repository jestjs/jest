/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import run, {
  RunJestJsonResult,
  RunJestResult,
  json as runWithJson,
} from '../runJest';

describe('Given a config with two named projects, first-project and second-project', () => {
  const dir = resolve(__dirname, '..', 'select-projects');

  describe('when Jest is started with `--selectProjects first-project`', () => {
    let result: RunJestJsonResult;
    beforeAll(() => {
      result = runWithJson('select-projects', [
        '--selectProjects',
        'first-project',
      ]);
    });
    it('runs the tests in the first project only', () => {
      expect(result.json).toHaveProperty('success', true);
      expect(result.json).toHaveProperty('numTotalTests', 1);
      expect(result.json.testResults.map(({name}) => name)).toEqual([
        resolve(dir, '__tests__/first-project.test.js'),
      ]);
    });
    it('prints that only first-project will run', () => {
      expect(result.stderr).toMatch(/^Running one project: first-project/);
    });
  });

  describe('when Jest is started with `--selectProjects second-project`', () => {
    let result: RunJestJsonResult;
    beforeAll(() => {
      result = runWithJson('select-projects', [
        '--selectProjects',
        'second-project',
      ]);
    });
    it('runs the tests in the second project only', () => {
      expect(result.json).toHaveProperty('success', true);
      expect(result.json).toHaveProperty('numTotalTests', 1);
      expect(result.json.testResults.map(({name}) => name)).toEqual([
        resolve(dir, '__tests__/second-project.test.js'),
      ]);
    });
    it('prints that only second-project will run', () => {
      expect(result.stderr).toMatch(/^Running one project: second-project/);
    });
  });

  describe('when Jest is started with `--selectProjects first-project second-project`', () => {
    let result: RunJestJsonResult;
    beforeAll(() => {
      result = runWithJson('select-projects', [
        '--selectProjects',
        'first-project',
        'second-project',
      ]);
    });
    it('runs the tests in the first and second projects', () => {
      expect(result.json).toHaveProperty('success', true);
      expect(result.json).toHaveProperty('numTotalTests', 2);
      expect(result.json.testResults.map(({name}) => name).sort()).toEqual([
        resolve(dir, '__tests__/first-project.test.js'),
        resolve(dir, '__tests__/second-project.test.js'),
      ]);
    });
    it('prints that both first-project and second-project will run', () => {
      expect(result.stderr).toMatch(
        /^Running 2 projects:\n- first-project\n- second-project/,
      );
    });
  });

  describe('when Jest is started without providing `--selectProjects`', () => {
    let result: RunJestJsonResult;
    beforeAll(() => {
      result = runWithJson('select-projects', []);
    });
    it('runs the tests in the first and second projects', () => {
      expect(result.json).toHaveProperty('success', true);
      expect(result.json).toHaveProperty('numTotalTests', 2);
      expect(result.json.testResults.map(({name}) => name).sort()).toEqual([
        resolve(dir, '__tests__/first-project.test.js'),
        resolve(dir, '__tests__/second-project.test.js'),
      ]);
    });
    it('does not print which projects are run', () => {
      expect(result.stderr).not.toMatch(/^Running/);
    });
  });

  describe('when Jest is started with `--selectProjects third-project`', () => {
    let result: RunJestResult;
    beforeAll(() => {
      result = run('select-projects', ['--selectProjects', 'third-project']);
    });
    it('fails', () => {
      expect(result).toHaveProperty('failed', true);
    });
    it('prints that no project was found', () => {
      expect(result.stdout).toMatch(
        /^You provided values for --selectProjects but no projects were found matching the selection/,
      );
    });
  });

  describe('when Jest is started with `--ignoreProjects first-project', () => {
    let result: RunJestJsonResult;
    beforeAll(() => {
      result = runWithJson('select-projects', [
        '--ignoreProjects',
        'first-project',
      ]);
    });
    it('runs the tests in the second project only', () => {
      expect(result.json).toHaveProperty('success', true);
      expect(result.json).toHaveProperty('numTotalTests', 1);
      expect(result.json.testResults.map(({name}) => name)).toEqual([
        resolve(dir, '__tests__/second-project.test.js'),
      ]);
    });
    it('prints that only second-project will run', () => {
      expect(result.stderr).toMatch(/^Running one project: second-project/);
    });
  });

  describe('when Jest is started with `--ignoreProjects second-project', () => {
    let result: RunJestJsonResult;
    beforeAll(() => {
      result = runWithJson('select-projects', [
        '--ignoreProjects',
        'second-project',
      ]);
    });
    it('runs the tests in the first project only', () => {
      expect(result.json).toHaveProperty('success', true);
      expect(result.json).toHaveProperty('numTotalTests', 1);
      expect(result.json.testResults.map(({name}) => name)).toEqual([
        resolve(dir, '__tests__/first-project.test.js'),
      ]);
    });
    it('prints that only first-project will run', () => {
      expect(result.stderr).toMatch(/^Running one project: first-project/);
    });
  });

  describe('when Jest is started with `--ignoreProjects third-project`', () => {
    let result: RunJestJsonResult;
    beforeAll(() => {
      result = runWithJson('select-projects', [
        '--ignoreProjects',
        'third-project',
      ]);
    });
    it('runs the tests in the first and second projects', () => {
      expect(result.json).toHaveProperty('success', true);
      expect(result.json).toHaveProperty('numTotalTests', 2);
      expect(result.json.testResults.map(({name}) => name).sort()).toEqual([
        resolve(dir, '__tests__/first-project.test.js'),
        resolve(dir, '__tests__/second-project.test.js'),
      ]);
    });
    it('prints that both first-project and second-project will run', () => {
      expect(result.stderr).toMatch(
        /^Running 2 projects:\n- first-project\n- second-project/,
      );
    });
  });

  describe('when Jest is started with `--ignoreProjects first-project second-project`', () => {
    let result: RunJestResult;
    beforeAll(() => {
      result = run('select-projects', [
        '--ignoreProjects',
        'first-project',
        'second-project',
      ]);
    });
    it('fails', () => {
      expect(result).toHaveProperty('failed', true);
    });
    it.skip('prints that no project was found', () => {
      expect(result.stdout).toMatch(
        /^You provided values for --ignoreProjects, but no projects were found matching the selection/,
      );
    });
  });

  describe('when Jest is started with `--selectProjects first-project second-project --ignoreProjects first-project` ', () => {
    let result: RunJestJsonResult;
    beforeAll(() => {
      result = runWithJson('select-projects', [
        '--selectProjects',
        'first-project',
        'second-project',
        '--ignoreProjects',
        'first-project',
      ]);
    });
    it('runs the tests in the second project only', () => {
      expect(result.json).toHaveProperty('success', true);
      expect(result.json).toHaveProperty('numTotalTests', 1);
      expect(result.json.testResults.map(({name}) => name)).toEqual([
        resolve(dir, '__tests__/second-project.test.js'),
      ]);
    });
    it('prints that only second-project will run', () => {
      expect(result.stderr).toMatch(/^Running one project: second-project/);
    });
  });

  describe('when Jest is started with `--selectProjects first-project --ignoreProjects first-project` ', () => {
    let result: RunJestResult;
    beforeAll(() => {
      result = run('select-projects', [
        '--selectProjects',
        'first-project',
        '--ignoreProjects',
        'first-project',
      ]);
    });
    it('fails', () => {
      expect(result).toHaveProperty('failed', true);
    });
    it.skip('prints that no project was found', () => {
      expect(result.stdout).toMatch(
        /^You provided values for --selectProjects and --ignoreProjects, but no projects were found matching the selection./,
      );
    });
  });
});

describe('Given a config with two projects, first-project and an unnamed project', () => {
  const dir = resolve(__dirname, '..', 'select-projects-missing-name');

  describe('when Jest is started with `--selectProjects first-project`', () => {
    let result: RunJestJsonResult;
    beforeAll(() => {
      result = runWithJson('select-projects-missing-name', [
        '--selectProjects',
        'first-project',
      ]);
    });
    it('runs the tests in the first project only', () => {
      expect(result.json.success).toBe(true);
      expect(result.json.numTotalTests).toBe(1);
      expect(result.json.testResults.map(({name}) => name)).toEqual([
        resolve(dir, '__tests__/first-project.test.js'),
      ]);
    });
    it('prints that a project does not have a name', () => {
      expect(result.stderr).toMatch(
        /^You provided values for --selectProjects but a project does not have a name/,
      );
    });
    it('prints that only first-project will run', () => {
      const stderrThirdLine = result.stderr.split('\n')[2];
      expect(stderrThirdLine).toMatch(/^Running one project: first-project/);
    });
  });

  describe('when Jest is started without providing `--selectProjects`', () => {
    let result: RunJestJsonResult;
    beforeAll(() => {
      result = runWithJson('select-projects-missing-name', []);
    });
    it('runs the tests in the first and second projects', () => {
      expect(result.json.success).toBe(true);
      expect(result.json.numTotalTests).toBe(2);
      expect(result.json.testResults.map(({name}) => name).sort()).toEqual([
        resolve(dir, '__tests__/first-project.test.js'),
        resolve(dir, '__tests__/second-project.test.js'),
      ]);
    });
    it('does not print that a project has no name', () => {
      expect(result.stderr).not.toMatch(
        /^You provided values for --selectProjects but a project does not have a name/,
      );
    });
  });

  describe('when Jest is started with `--selectProjects third-project`', () => {
    let result: RunJestResult;
    beforeAll(() => {
      result = run('select-projects-missing-name', [
        '--selectProjects',
        'third-project',
      ]);
    });
    it('fails', () => {
      expect(result).toHaveProperty('failed', true);
    });
    it('prints that a project does not have a name', () => {
      expect(result.stdout).toMatch(
        /^You provided values for --selectProjects but a project does not have a name/,
      );
    });
    it('prints that no project was found', () => {
      const stdoutThirdLine = result.stdout.split('\n')[2];
      expect(stdoutThirdLine).toMatch(
        /^You provided values for --selectProjects but no projects were found matching the selection/,
      );
    });
  });

  describe('when Jest is started with `--ignoreProjects first-project`', () => {
    let result: RunJestJsonResult;
    beforeAll(() => {
      result = runWithJson('select-projects-missing-name', [
        '--ignoreProjects',
        'first-project',
      ]);
    });
    it('runs the tests in the second project only', () => {
      expect(result.json.success).toBe(true);
      expect(result.json.numTotalTests).toBe(1);
      expect(result.json.testResults.map(({name}) => name)).toEqual([
        resolve(dir, '__tests__/second-project.test.js'),
      ]);
    });
    it('prints that a project does not have a name', () => {
      expect(result.stderr).toMatch(
        /^You provided values for --ignoreProjects but a project does not have a name/,
      );
    });
    it('prints that only second-project will run', () => {
      const stderrThirdLine = result.stderr.split('\n')[2];
      expect(stderrThirdLine).toMatch(
        /^Running one project: <unnamed project>/,
      );
    });
  });
});
