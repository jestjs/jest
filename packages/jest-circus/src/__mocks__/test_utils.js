/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import os from 'os';
import path from 'path';
import {spawnSync} from 'child_process';
import fs from 'fs';

const CIRCUS_PATH = path.resolve(__dirname, '../../build/index');
const CIRCUS_RUN_PATH = path.resolve(__dirname, '../../build/run');
const CIRCUS_STATE_PATH = path.resolve(__dirname, '../../build/state');
const TEST_EVENT_HANDLER_PATH = path.resolve(__dirname, './test_event_handler');

const runTest = (source: string) => {
  const tmpFilename = path.join(os.tmpdir(), 'circus-test-file.js');

  const content = `
    const circus = require('${CIRCUS_PATH}');
    global.test = circus.test;
    global.describe = circus.describe;
    global.beforeEach = circus.beforeEach;
    global.afterEach = circus.afterEach;
    global.beforeAll = circus.beforeAll;
    global.afterAll = circus.afterAll;

    const testEventHandler = require('${TEST_EVENT_HANDLER_PATH}');
    const addEventHandler = require('${CIRCUS_STATE_PATH}').addEventHandler;
    addEventHandler(testEventHandler);

    ${source};

    const run = require('${CIRCUS_RUN_PATH}');

    run();
  `;

  fs.writeFileSync(tmpFilename, content);
  const result = spawnSync('node', [tmpFilename], {cwd: process.cwd()});

  if (result.status !== 0) {
    const message = `
      STDOUT: ${result.stdout && result.stdout.toString()}
      STDERR: ${result.stderr && result.stderr.toString()}
      STATUS: ${result.status}
      ERROR: ${String(result.error)}
    `;
    throw new Error(message);
  }

  result.stdout = String(result.stdout);
  result.stderr = String(result.stderr);

  if (result.stderr) {
    throw new Error(
      `
      Unexpected stderr:
      ${result.stderr}
    `,
    );
  }
  return result;
};

module.exports = {
  runTest,
};
