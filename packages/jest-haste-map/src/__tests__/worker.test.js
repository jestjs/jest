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
import ConditionalTest from '../../../../scripts/ConditionalTest';

import H from '../constants';

const {worker, getSha1} = require('../worker');

let mockFs;
let readFileSync;
let readFile;

describe('worker', () => {
  ConditionalTest.skipSuiteOnWindows();

  beforeEach(() => {
    mockFs = {
      '/fruits/apple.png': Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
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
      '/package.json': [
        '{',
        '  "name": "haste-package",',
        '  "main": "foo.js"',
        '}',
      ].join('\n'),
    };

    readFileSync = fs.readFileSync;
    readFile = fs.readFile;

    fs.readFileSync = jest.fn((path, options) => {
      if (mockFs[path]) {
        return options === 'utf8' ? mockFs[path] : Buffer.from(mockFs[path]);
      }

      throw new Error(`Cannot read path '${path}'.`);
    });

    fs.readFile = jest.fn(readFile);
  });

  afterEach(() => {
    fs.readFileSync = readFileSync;
    fs.readFile = readFile;
  });

  it('parses JavaScript files and extracts module information', async () => {
    expect(
      await worker({computeDependencies: true, filePath: '/fruits/pear.js'}),
    ).toEqual({
      dependencies: ['Banana', 'Strawberry'],
      id: 'Pear',
      module: ['/fruits/pear.js', H.MODULE],
    });

    expect(
      await worker({
        computeDependencies: true,
        filePath: '/fruits/strawberry.js',
      }),
    ).toEqual({
      dependencies: [],
      id: 'Strawberry',
      module: ['/fruits/strawberry.js', H.MODULE],
    });
  });

  it('delegates to hasteImplModulePath for getting the id', async () => {
    const moduleData = await worker({
      computeDependencies: true,
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
    expect(
      await worker({computeDependencies: true, filePath: '/package.json'}),
    ).toEqual({
      dependencies: undefined,
      id: 'haste-package',
      module: ['/package.json', H.PACKAGE],
    });
  });

  it('returns an error when a file cannot be accessed', async () => {
    let error = null;

    try {
      await worker({computeDependencies: true, filePath: '/kiwi.js'});
    } catch (err) {
      error = err;
    }

    expect(error.message).toEqual(`Cannot read path '/kiwi.js'.`);
  });

  it('simply computes SHA-1s when requested (works well with binary data)', async () => {
    expect(
      await getSha1({computeSha1: true, filePath: '/fruits/apple.png'}),
    ).toEqual({sha1: '4caece539b039b16e16206ea2478f8c5ffb2ca05'});

    expect(
      await getSha1({computeSha1: false, filePath: '/fruits/banana.js'}),
    ).toEqual({sha1: null});

    expect(
      await getSha1({computeSha1: true, filePath: '/fruits/banana.js'}),
    ).toEqual({sha1: 'f24c6984cce6f032f6d55d771d04ab8dbbe63c8c'});

    expect(
      await getSha1({computeSha1: true, filePath: '/fruits/pear.js'}),
    ).toEqual({sha1: '1bf6fc618461c19553e27f8b8021c62b13ff614a'});

    await expect(
      getSha1({computeSha1: true, filePath: '/i/dont/exist.js'}),
    ).rejects.toThrow();
  });

  it('avoids computing dependencies if not requested and Haste does not need it', async () => {
    expect(
      await worker({
        computeDependencies: false,
        filePath: '/fruits/pear.js',
        hasteImplModulePath: path.resolve(__dirname, 'haste_impl.js'),
      }),
    ).toEqual({
      dependencies: undefined,
      id: 'pear',
      module: ['/fruits/pear.js', H.MODULE],
      sha1: undefined,
    });

    // Ensure not disk access happened.
    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(fs.readFile).not.toHaveBeenCalled();
  });
});
