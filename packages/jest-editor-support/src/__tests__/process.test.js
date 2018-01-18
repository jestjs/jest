/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

jest.mock('child_process');

import {createProcess} from '../Process';
import {spawn} from 'child_process';

describe('createProcess', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('spawns the process', () => {
    const workspace: any = {pathToJest: ''};
    const args = [];
    createProcess(workspace, args);

    expect(spawn).toBeCalled();
  });

  it('spawns the command from workspace.pathToJest', () => {
    const workspace: any = {pathToJest: 'jest'};
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][0]).toBe('jest');
    expect(spawn.mock.calls[0][1]).toEqual([]);
  });

  it('spawns the first arg from workspace.pathToJest split on " "', () => {
    const workspace: any = {pathToJest: 'npm test --'};
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][0]).toBe('npm');
    expect(spawn.mock.calls[0][1]).toEqual(['test', '--']);
  });

  it('fails to spawn the first quoted arg from workspace.pathToJest', () => {
    const workspace: any = {
      pathToJest:
        '"../build scripts/test" --coverageDirectory="../code coverage"',
    };
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][0]).not.toBe('"../build scripts/test"');
    expect(spawn.mock.calls[0][1]).not.toEqual([
      '--coverageDirectory="../code coverage"',
    ]);
  });

  it('appends args', () => {
    const workspace: any = {pathToJest: 'npm test --'};
    const args = ['--option', 'value', '--another'];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][1]).toEqual(['test', '--', ...args]);
  });

  it('sets the --config arg to workspace.pathToConfig', () => {
    const workspace: any = {
      pathToConfig: 'non-standard.jest.js',
      pathToJest: 'npm test --',
    };
    const args = ['--option', 'value'];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][1]).toEqual([
      'test',
      '--',
      '--option',
      'value',
      '--config',
      'non-standard.jest.js',
    ]);
  });

  it('defines the "CI" environment variable', () => {
    const expected = Object.assign({}, process.env, {CI: 'true'});

    const workspace: any = {pathToJest: ''};
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][2].env).toEqual(expected);
  });

  it('sets the current working directory of the child process', () => {
    const workspace: any = {
      pathToJest: '',
      rootPath: 'root directory',
    };
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][2].cwd).toBe(workspace.rootPath);
  });

  it('should not set the "shell" property when "options" are not provided', () => {
    const workspace: any = {pathToJest: ''};
    const args = [];
    createProcess(workspace, args);

    expect(spawn.mock.calls[0][2].shell).not.toBeDefined();
  });

  it('should set the "shell" property when "options" are provided', () => {
    const expected = {};
    const workspace: any = {pathToJest: ''};
    const args = [];
    const options: any = {shell: expected};
    createProcess(workspace, args, options);

    expect(spawn.mock.calls[0][2].shell).toBe(expected);
  });
});
