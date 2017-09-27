/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import EventEmitter from 'events';
import ProjectWorkspace from '../project_workspace';
import Settings from '../Settings';

describe('Settings', () => {
  it('sets itself up fom the constructor', () => {
    const workspace = new ProjectWorkspace(
      'root_path',
      'path_to_jest',
      'test',
      1000,
    );
    const settings = new Settings(workspace);
    expect(settings.workspace).toEqual(workspace);
    expect(settings.settings).toEqual(expect.any(Object));
  });

  it('reads and parses the config', () => {
    const workspace = new ProjectWorkspace(
      'root_path',
      'path_to_jest',
      'test',
      1000,
    );
    const completed = jest.fn();
    const config = {cacheDirectory: '/tmp/jest', name: '[md5 hash]'};
    const json = {
      config,
      version: '19.0.0',
    };

    const mockProcess: any = new EventEmitter();
    mockProcess.stdout = new EventEmitter();
    const createProcess = () => mockProcess;
    const buffer = makeBuffer(JSON.stringify(json));
    const settings = new Settings(workspace, {createProcess});

    settings.getConfig(completed);
    settings.getConfigProcess.stdout.emit('data', buffer);
    settings.getConfigProcess.emit('close');

    expect(completed).toHaveBeenCalled();
    expect(settings.jestVersionMajor).toBe(19);
    expect(settings.settings).toEqual(config);
  });

  it('calls callback even if no data is sent', () => {
    const workspace = new ProjectWorkspace(
      'root_path',
      'path_to_jest',
      'test',
      1000,
    );
    const completed = jest.fn();

    const mockProcess: any = new EventEmitter();
    mockProcess.stdout = new EventEmitter();
    const createProcess = () => mockProcess;
    const settings = new Settings(workspace, {createProcess});

    settings.getConfig(completed);
    settings.getConfigProcess.emit('close');

    expect(completed).toHaveBeenCalled();
  });
});

const makeBuffer = (content: string) => {
  // Buffer.from is not supported in < Node 5.10
  if (typeof Buffer.from === 'function') {
    return Buffer.from(content);
  }

  return new Buffer(content);
};
