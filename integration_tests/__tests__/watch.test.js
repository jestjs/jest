/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import {spawn} from 'child_process';
import {cleanup, run, writeFiles} from '../utils';
import os from 'os';
import path from 'path';

const JEST_PATH = path.resolve(
  __dirname,
  '../../packages/jest-cli/bin/jest.js',
);
const DIR = path.resolve(os.tmpdir(), 'watch_test');
const GIT = 'git -c user.name=jest_test -c user.email=jest_test@test.com';

const skipOnWindows = require('skipOnWindows');
skipOnWindows.suite();

beforeEach(() => cleanup(DIR));

const sleep = () => new Promise(resolve => setTimeout(resolve, 100));

class WatchTester {
  constructor(cwd, args) {
    this.stdoutBuffer = '';
    this.stderrBuffer = '';
    this.done = false;
    this.exitCode = null;
    this.process = spawn(JEST_PATH, ['--watch'].concat(args || []), {cwd});
    this.process.stdout.on('data', data => (this.stdoutBuffer += data));
    this.process.stderr.on('data', data => (this.stderrBuffer += data));
    this.process.on('close', code => {
      this.done = true;
      this.exitCode = code;
    });
  }

  async waitForStdout(pattern) {
    let timeout = false;
    const timeoutID = setTimeout(() => (timeout = true), 2000);

    while (true) {
      await sleep();
      if (this.stdoutBuffer.match(pattern)) {
        timeoutID.unref && timeoutID.unref();
        clearTimeout(timeoutID);
        return;
      }

      if (timeout) {
        this.kill();
        throw new Error(
          `waitForStdout timeout. pattern: ${String(pattern)}` +
            `, stdout:\n${String(this.stdoutBuffer)}`,
        );
      }
    }
  }

  async waitForStderr(pattern) {
    let timeout = false;
    const timeoutID = setTimeout(() => (timeout = true), 2000);

    while (true) {
      await sleep();
      if (this.stderrBuffer.match(pattern)) {
        timeoutID.unref && timeoutID.unref();
        clearTimeout(timeoutID);
        return;
      }

      if (timeout) {
        this.kill();
        throw new Error(
          `waitForStderr timeout. pattern: ${String(pattern)}` +
            `, stderr:\n${String(this.stderrBuffer)}`,
        );
      }
    }
  }

  flushStdout() {
    const stdout = this.stdoutBuffer;
    this.stdoutBuffer = '';
    return stdout;
  }

  flushStderr() {
    const stderr = this.stderrBuffer;
    this.stderrBuffer = '';
    return stderr;
  }

  kill() {
    this.process.kill('SIGTERM');
  }
}

test('watch mode', async () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/test1.test.js': `test('test', () => {});`,
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });
  run(`${GIT} init .`, DIR);

  const watchTester = new WatchTester(DIR);
  await watchTester.waitForStderr(/ran all test suites/i);
  expect(watchTester.flushStderr()).toMatch('PASS  __tests__/test1.test.js');
  expect(watchTester.flushStdout()).toMatch('Watch Usage');
  watchTester.kill();
});
