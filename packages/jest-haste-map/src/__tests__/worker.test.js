/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

const path = require('path');
const fs = require('graceful-fs');
const skipOnWindows = require('../../../../scripts/skip_on_windows');

const H = require('../constants');
const worker = require('../worker');

let createCallback;
let mockFs;
let moduleData;
let readFileSync;
let workerError;

describe('worker', () => {
  skipOnWindows.suite();

  beforeEach(() => {
    mockFs = {
      '/fruits/banana.js': [
        '/**',
        ' * @providesModule Banana',
        ' */',
        'const Strawberry = require("Strawberry");',
      ].join('\n'),
      '/fruits/pear.js': [
        '/**',
        ' * @providesModule Pear',
        ' */',
        'const Banana = require("Banana");',
        'const Strawberry = require(`Strawberry`);',
      ].join('\n'),
      '/fruits/strawberry.js': [
        '/**',
        ' * @providesModule Strawberry',
        ' */',
      ].join('\n'),
      '/package.json': ['{', '  "name": "haste-package"', '}'].join('\n'),
    };

    readFileSync = fs.readFileSync;
    fs.readFileSync = jest.fn((path, options) => {
      expect(options).toBe('utf8');

      if (mockFs[path]) {
        return mockFs[path];
      }

      throw new Error(`Cannot read path '${path}'.`);
    });

    moduleData = null;
    workerError = null;
    createCallback = () =>
      jest.fn((error, data) => {
        workerError = error;
        moduleData = data;
      });
  });

  afterEach(() => {
    fs.readFileSync = readFileSync;
  });

  it('parses JavaScript files and extracts module information', () => {
    let callback = createCallback();
    worker({filePath: '/fruits/pear.js'}, callback);

    // Worker is synchronous. callback must have been called by now
    expect(callback).toBeCalled();

    expect(workerError).toBe(null);
    expect(moduleData).toEqual({
      dependencies: ['Banana', 'Strawberry'],
      id: 'Pear',
      module: ['/fruits/pear.js', H.MODULE],
    });

    callback = createCallback();
    worker({filePath: '/fruits/strawberry.js'}, callback);

    expect(callback).toBeCalled();

    expect(workerError).toBe(null);
    expect(moduleData).toEqual({
      dependencies: [],
      id: 'Strawberry',
      module: ['/fruits/strawberry.js', H.MODULE],
    });
  });

  it('delegates to hasteImplModulePath for getting the id', () => {
    const callback = createCallback();
    worker(
      {
        filePath: '/fruits/strawberry.js',
        hasteImplModulePath: path.resolve(__dirname, 'haste_impl.js'),
      },
      callback,
    );

    // Worker is synchronous. callback must have been called by now
    expect(callback).toBeCalled();

    expect(workerError).toBe(null);
    expect(moduleData.id).toBe('strawberry');
    expect(moduleData).toEqual(
      expect.objectContaining({
        dependencies: expect.any(Array),
        id: expect.any(String),
        module: expect.any(Array),
      }),
    );
  });

  it('parses package.json files as haste packages', () => {
    const callback = createCallback();

    worker({filePath: '/package.json'}, callback);
    expect(callback).toBeCalled();

    expect(workerError).toBe(null);
    expect(moduleData).toEqual({
      dependencies: undefined,
      id: 'haste-package',
      module: ['/package.json', H.PACKAGE],
    });
  });

  it('returns an error when a file cannot be accessed', () => {
    const callback = createCallback();

    worker({filePath: '/kiwi.js'}, callback);

    expect(callback).toBeCalled();
    expect(moduleData).toBe(undefined);
    expect(workerError.type).toEqual('Error');
    expect(workerError.message).toEqual(`Cannot read path '/kiwi.js'.`);
  });
});
