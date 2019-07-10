/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import {JestHook} from 'jest-watcher';
import Runtime from 'jest-runtime';
import {normalize} from 'jest-config';
import path from 'path';
import fs from 'fs';

describe('Watch mode flows with changed files', () => {
  let watch;
  let pipe;
  let stdin;
  const fileTargetPath = `${__dirname}/__fixtures__/hey.js`;
  const fileTargetPath2 = `${__dirname}/__fixtures__/heyhey.test.js`;
  const cacheDirectory = `${__dirname}/tmp${Math.random()}`;
  let hasteMapInstance;
  const deleteFolderRecursive = pathname => {
    if (fs.existsSync(pathname)) {
      fs.readdirSync(pathname).forEach((file, index) => {
        const curPath = path.resolve(pathname, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          // recurse
          deleteFolderRecursive(curPath);
        } else {
          // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(pathname);
    }
  };

  beforeEach(() => {
    watch = require('../watch').default;
    pipe = {write: jest.fn()};
    stdin = new MockStdin();
  });

  afterEach(() => {
    jest.resetModules();
    hasteMapInstance.end();
    [fileTargetPath2, fileTargetPath].forEach(file => {
      try {
        fs.unlinkSync(file);
      } catch (e) {}
    });
    deleteFolderRecursive(cacheDirectory);
  });

  it('should correct require new files without legacy cache', async () => {
    fs.writeFileSync(
      fileTargetPath2,
      `
        require('${fileTargetPath}');
        describe('Fake test', () => {
            it('Hey', () => {  
            
            });
        });
      `,
      {
        encoding: 'utf-8',
      },
    );

    fs.mkdirSync(cacheDirectory);
    const config = normalize(
      {
        automock: false,
        cache: false,
        cacheDirectory,
        coverageReporters: [],
        maxConcurrency: 1,
        maxWorkers: 1,
        moduleDirectories: ['node_modules'],
        moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
        modulePathIgnorePatterns: [],
        onlyChanged: false,
        reporters: [],
        rootDir: __dirname,
        roots: [__dirname],
        testPathIgnorePatterns: ['/node_modules/'],
        testRegex: ['hey\\.test\\.js$'],
        watch: false,
        watchman: false,
      },
      [],
    ).options;

    hasteMapInstance = await Runtime.createHasteMap(config, {
      maxWorkers: 1,
      resetCache: true,
      retainAllFiles: true,
      watch: true,
      watchman: true,
    });

    const realContext = await hasteMapInstance.build().then(
      hasteMap => ({
        config,
        hasteFS: hasteMap.hasteFS,
        moduleMap: hasteMap.moduleMap,
        resolver: Runtime.createResolver(config, hasteMap.moduleMap),
      }),
      error => {
        throw error;
      },
    );

    const hook = new JestHook();
    await watch(
      {
        ...config,
        watchPlugins: [],
      },
      [realContext],
      pipe,
      [hasteMapInstance],
      stdin,
      hook,
    );

    await new Promise(resolve => setTimeout(resolve, 300));

    fs.writeFileSync(
      fileTargetPath,
      `
        describe('Fake group', () => {
            it('Fake 1', () => {});
            it('Fake 2', () => {});
            it('Fake 3', () => {});
        });
      `,
      {encoding: 'utf-8'},
    );

    const resultReport = await new Promise(resolve => {
      hook.getSubscriber().onTestRunComplete(result => {
        resolve({
          numFailedTests: result.numFailedTests,
          numPassedTests: result.numPassedTests,
        });
      });
    });

    expect(resultReport).toEqual({
      numFailedTests: 0,
      numPassedTests: 4,
    });
  });
});

class MockStdin {
  constructor() {
    this._callbacks = [];
  }

  setRawMode() {}

  resume() {}

  setEncoding() {}

  on(evt, callback) {
    this._callbacks.push(callback);
  }

  emit(key) {
    this._callbacks.forEach(cb => cb(key));
  }
}
