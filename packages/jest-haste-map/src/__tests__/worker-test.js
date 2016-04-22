/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.unmock('../constants')
  .unmock('../lib/docblock')
  .unmock('../lib/extractRequires')
  .unmock('../worker');

let H;
let createCallback;
let fs;
let mockFs;
let moduleData;
let readFileSync;
let worker;
let workerError;

describe('worker', () => {

  beforeEach(() => {
    mockFs = {
      '/fruits/pear.js': [
        '/**',
        ' * @providesModule Pear',
        ' */',
        'const Banana = require("Banana");',
        'const Strawberry = require("Strawberry");',
      ].join('\n'),
      '/fruits/banana.js': [
        '/**',
        ' * @providesModule Banana',
        ' */',
        'const Strawberry = require("Strawberry");',
      ].join('\n'),
      '/fruits/strawberry.js': [
        '/**',
        ' * @providesModule Strawberry',
        ' */',
      ].join('\n'),
      '/package.json': [
        '{',
        '  "name": "haste-package"',
        '}',
      ].join('\n'),
    };

    H = require('../constants');
    worker = require('../worker');

    fs = require('graceful-fs');
    readFileSync = fs.readFileSync;
    fs.readFileSync = jest.fn((path, options) => {
      expect(options).toBe('utf-8');

      if (mockFs[path]) {
        return mockFs[path];
      }

      throw new Error(`Cannot read path '${path}'.`);
    });

    moduleData = null;
    workerError = null;
    createCallback = () => jest.fn((error, data) => {
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
      id: 'Pear',
      module: ['/fruits/pear.js', H.MODULE],
      dependencies: ['Banana', 'Strawberry'],
    });

    callback = createCallback();
    worker({filePath: '/fruits/strawberry.js'}, callback);

    expect(callback).toBeCalled();

    expect(workerError).toBe(null);
    expect(moduleData).toEqual({
      id: 'Strawberry',
      module: ['/fruits/strawberry.js', H.MODULE],
      dependencies: [],
    });
  });

  it('parses package.json files as haste packages', () => {
    const callback = createCallback();

    worker({filePath: '/package.json'}, callback);
    expect(callback).toBeCalled();

    expect(workerError).toBe(null);
    expect(moduleData).toEqual({
      id: 'haste-package',
      module: ['/package.json', H.PACKAGE],
      dependencies: undefined,
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
