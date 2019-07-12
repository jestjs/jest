/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import path from 'path';
import fs from 'fs';
import {JestHook} from 'jest-watcher';
import Runtime from 'jest-runtime';
import {normalize} from 'jest-config';
import HasteMap from 'jest-haste-map';
import {AggregatedResult} from '@jest/test-result';

describe('Watch mode flows with changed files', () => {
  let watch: any;
  let pipe: NodeJS.ReadStream;
  let stdin: MockStdin;
  const fileTargetPath = path.resolve(
    __dirname,
    '__fixtures__',
    'lost-file.js',
  );
  const fileTargetPath2 = path.resolve(
    __dirname,
    '__fixtures__',
    'watch-test.test.js',
  );
  const cacheDirectory = path.resolve(__dirname, `tmp${Math.random()}`);
  let hasteMapInstance: HasteMap;
  const deleteFolderRecursive = pathname => {
    if (fs.existsSync(pathname)) {
      fs.readdirSync(pathname).forEach(file => {
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
    pipe = {write: jest.fn()} as any;
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
        silent: true,
        testRegex: ['watch-test\\.test\\.js$'],
        watch: false,
        watchman: false,
      },
      {} as any,
    ).options;

    hasteMapInstance = await Runtime.createHasteMap(config, {
      maxWorkers: 1,
      resetCache: true,
      watch: true,
      watchman: false,
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

    await new Promise(resolve => {
      hook.getSubscriber().onTestRunComplete(resolve);
    });

    // Create lost file
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

    const resultSuccessReport: AggregatedResult = await new Promise(resolve => {
      hook.getSubscriber().onTestRunComplete(resolve);
    });

    expect(resultSuccessReport).toMatchObject({
      numFailedTestSuites: 0,
      numFailedTests: 0,
      numPassedTests: 4,
      numRuntimeErrorTestSuites: 0,
      success: true,
      wasInterrupted: false,
    });
    expect(resultSuccessReport.testResults[0]).toMatchObject({
      failureMessage: null,
    });

    // Remove again to ensure about no legacy cache
    fs.unlinkSync(fileTargetPath);

    const resultErrorReport: AggregatedResult = await new Promise(resolve => {
      hook.getSubscriber().onTestRunComplete(resolve);
    });

    // After remove file we have to fail tests
    expect(resultErrorReport).toMatchObject({
      numFailedTestSuites: 1,
      numPassedTests: 0,
      numRuntimeErrorTestSuites: 1,
      success: false,
      wasInterrupted: false,
    });
  });
});

class MockStdin {
  private _callbacks: Array<any>;

  constructor() {
    this._callbacks = [];
  }

  resume() {}

  setEncoding() {}

  on(_: any, callback: any) {
    this._callbacks.push(callback);
  }

  emit(key: string) {
    this._callbacks.forEach(cb => cb(key));
  }
}
