/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {sync as spawnSync} from 'execa';
import * as fs from 'graceful-fs';
import tempy = require('tempy');

const CIRCUS_PATH = require.resolve('../').replace(/\\/g, '\\\\');
const CIRCUS_RUN_PATH = require.resolve('../run').replace(/\\/g, '\\\\');
const CIRCUS_STATE_PATH = require.resolve('../state').replace(/\\/g, '\\\\');
const TEST_EVENT_HANDLER_PATH = require
  .resolve('./testEventHandler')
  .replace(/\\/g, '\\\\');
const BABEL_REGISTER_PATH = require
  .resolve('@babel/register')
  .replace(/\\/g, '\\\\');

export const runTest = (
  source: string,
  opts?: {seed?: number; randomize?: boolean},
) => {
  const tmpFilename = tempy.file();

  const content = `
    require('${BABEL_REGISTER_PATH}')({extensions: [".js", ".ts"]});
    const circus = require('${CIRCUS_PATH}');
    global.test = circus.test;
    global.describe = circus.describe;
    global.beforeEach = circus.beforeEach;
    global.afterEach = circus.afterEach;
    global.beforeAll = circus.beforeAll;
    global.afterAll = circus.afterAll;

    const testEventHandler = require('${TEST_EVENT_HANDLER_PATH}').default;
    const {addEventHandler, getState} = require('${CIRCUS_STATE_PATH}');
    getState().randomize = ${opts?.randomize};
    getState().seed = ${opts?.seed ?? 0};
    addEventHandler(testEventHandler);

    ${source};

    const run = require('${CIRCUS_RUN_PATH}').default;

    run();
  `;

  fs.writeFileSync(tmpFilename, content);
  const result = spawnSync('node', [tmpFilename], {
    cwd: process.cwd(),
  });

  if (result.exitCode !== 0) {
    const message = `
      STDOUT: ${result.stdout && result.stdout.toString()}
      STDERR: ${result.stderr && result.stderr.toString()}
      STATUS: ${result.exitCode}
    `;
    throw new Error(message);
  }

  fs.rmSync(tmpFilename, {force: true});

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
