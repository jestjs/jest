/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
import type {AggregatedResult} from '@jest/test-result';
import {normalize} from 'jest-config';
import type {IHasteMap} from 'jest-haste-map';
import Runtime from 'jest-runtime';
import {interopRequireDefault} from 'jest-util';
import {JestHook} from 'jest-watcher';

describe('Watch mode flows with changed files', () => {
  jest.resetModules();

  let watch: typeof import('../watch').default;
  let pipe: NodeJS.WriteStream;
  let stdin: MockStdin;
  const testDirectory = path.resolve(tmpdir(), 'jest-tmp');
  const fileTargetPath = path.resolve(testDirectory, 'lost-file.js');
  const fileTargetPath2 = path.resolve(
    testDirectory,
    'watch-test-fake.test.js',
  );
  const cacheDirectory = path.resolve(tmpdir(), `tmp${Math.random()}`);
  let hasteMapInstance: IHasteMap;

  beforeEach(() => {
    watch = interopRequireDefault(require('../watch')).default;
    pipe = {write: jest.fn()} as unknown;
    stdin = new MockStdin();
    fs.rmSync(cacheDirectory, {force: true, recursive: true});
    fs.rmSync(testDirectory, {force: true, recursive: true});
    fs.mkdirSync(testDirectory);
    fs.mkdirSync(cacheDirectory);
  });

  afterEach(() => {
    jest.resetModules();
    if (hasteMapInstance) {
      hasteMapInstance.end();
    }
    fs.rmSync(cacheDirectory, {force: true, recursive: true});
    fs.rmSync(testDirectory, {force: true, recursive: true});
  });

  it('should correct require new files without legacy cache', async () => {
    fs.writeFileSync(
      fileTargetPath2,
      `
        require('./lost-file.js');
        describe('Fake test', () => {
            it('Hey', () => {

            });
        });
      `,
    );

    const config = (
      await normalize(
        {
          cache: false,
          cacheDirectory,
          coverageReporters: [],
          maxConcurrency: 1,
          maxWorkers: 1,
          moduleDirectories: ['node_modules'],
          onlyChanged: false,
          reporters: [],
          rootDir: testDirectory,
          silent: true,
          testRegex: ['watch-test-fake\\.test\\.js$'],
          watch: false,
          watchman: false,
        },
        {} as unknown,
      )
    ).options;

    hasteMapInstance = await Runtime.createHasteMap(config, {
      maxWorkers: 1,
      resetCache: true,
      watch: true,
      watchman: false,
    });

    const realContext = await hasteMapInstance.build().then(hasteMap => ({
      config,
      hasteFS: hasteMap.hasteFS,
      moduleMap: hasteMap.moduleMap,
      resolver: Runtime.createResolver(config, hasteMap.moduleMap),
    }));

    const hook = new JestHook();
    const firstErrorPromise = new Promise(resolve => {
      hook.getSubscriber().onTestRunComplete(resolve);
    });
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

    await firstErrorPromise;

    const successPromise = new Promise<AggregatedResult>(resolve => {
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
    );

    const resultSuccessReport = await successPromise;

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

    const errorPromise = new Promise<AggregatedResult>(resolve => {
      hook.getSubscriber().onTestRunComplete(resolve);
    });

    // Remove again to ensure about no legacy cache
    fs.unlinkSync(fileTargetPath);

    const resultErrorReport = await errorPromise;

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
  private readonly _callbacks: Array<unknown>;

  constructor() {
    this._callbacks = [];
  }

  resume() {}

  setEncoding() {}

  on(_: unknown, callback: unknown) {
    this._callbacks.push(callback);
  }

  emit(key: string) {
    this._callbacks.forEach(cb => cb(key));
  }
}
