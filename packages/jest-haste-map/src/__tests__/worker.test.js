/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import path from 'path';
import fs from 'graceful-fs';
import skipOnWindows from '../../../../scripts/skip_on_windows';

import H from '../constants';

const {worker} = require('../worker');

let mockFs;
let readFileSync;

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
  });

  afterEach(() => {
    fs.readFileSync = readFileSync;
  });

  it('parses JavaScript files and extracts module information', async () => {
    expect(await worker({filePath: '/fruits/pear.js'})).toEqual({
      dependencies: ['Banana', 'Strawberry'],
      id: 'Pear',
      module: ['/fruits/pear.js', H.MODULE],
    });

    expect(await worker({filePath: '/fruits/strawberry.js'})).toEqual({
      dependencies: [],
      id: 'Strawberry',
      module: ['/fruits/strawberry.js', H.MODULE],
    });
  });

  it('delegates to hasteImplModulePath for getting the id', async () => {
    const moduleData = await worker({
      filePath: '/fruits/strawberry.js',
      hasteImplModulePath: path.resolve(__dirname, 'haste_impl.js'),
    });

    expect(moduleData.id).toBe('strawberry');
    expect(moduleData).toEqual(
      expect.objectContaining({
        dependencies: expect.any(Array),
        id: expect.any(String),
        module: expect.any(Array),
      }),
    );
  });

  it('parses package.json files as haste packages', async () => {
    expect(await worker({filePath: '/package.json'})).toEqual({
      dependencies: undefined,
      id: 'haste-package',
      module: ['/package.json', H.PACKAGE],
    });
  });

  it('returns an error when a file cannot be accessed', async () => {
    let error = null;
    try {
      await worker({filePath: '/kiwi.js'});
    } catch (err) {
      error = err;
    }

    expect(error.message).toEqual(`Cannot read path '/kiwi.js'.`);
  });
});
