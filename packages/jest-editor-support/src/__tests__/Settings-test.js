/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const {EventEmitter} = require('events');
const ProjectWorkspace = require('../ProjectWorkspace');
const Settings = require('../Settings');

describe('Settings', () => {
  it('sets itself up fom the constructor', () => {
    const workspace = new ProjectWorkspace('root_path', 'path_to_jest');
    const settings = new Settings(workspace);
    expect(settings.workspace).toEqual(workspace);
    expect(settings.settings).toEqual(expect.any(Object));
  });

  it('reads and parses the config', () => {
    const workspace = new ProjectWorkspace('root_path', 'path_to_jest');
    const completed = jest.fn();
    const config = {cacheDirectory: '/tmp/jest', name: '[md5 hash]'};
    const json = {
      config,
      version: '19.0.0',
    };
    const createProcess = () => ({stdout: new EventEmitter()});
    const buffer = makeBuffer(JSON.stringify(json));
    const settings = new Settings(workspace, {createProcess});

    settings.getConfig(completed);
    settings.debugprocess.stdout.emit('data', buffer);

    expect(completed).toHaveBeenCalled();
    expect(settings.jestVersionMajor).toBe(19);
    expect(settings.settings).toEqual(config);
  });
});

const makeBuffer = (content: string) => {
  // Buffer.from is not supported in < Node 5.10
  if (typeof Buffer.from === 'function') {
    return Buffer.from(content);
  }

  return new Buffer(content);
};
