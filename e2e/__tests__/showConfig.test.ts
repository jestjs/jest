/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {cleanup, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'show-config-test');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('--showConfig outputs config info and exits', () => {
  writeFiles(DIR, {
    '__tests__/test.test.js': "test('test', () => {});",
    'package.json': JSON.stringify({jest: {environment: 'node'}}),
  });

  let {stdout} = runJest(DIR, [
    '--showConfig',
    '--no-cache',
    // Make the snapshot flag stable on CI.
    '--ci',
  ]);

  stdout = stdout
    .replaceAll('\\\\node_modules\\\\', 'node_modules')
    .replaceAll(/\\\\\.pnp\\\\\.\[\^[/\\]+]\+\$/g, '<<REPLACED_PNP_PATH>>')
    .replaceAll(/\\\\(?:([^.]+?)|$)/g, '/$1')
    .replaceAll(/"cacheDirectory": "(.+)"/g, '"cacheDirectory": "/tmp/jest"')
    .replaceAll(/"id": "(.+)"/g, '"id": "[md5 hash]"')
    .replaceAll(/"version": "(.+)"/g, '"version": "[version]"')
    .replaceAll(/"maxWorkers": (\d+)/g, '"maxWorkers": "[maxWorkers]"')
    .replaceAll(/"\S*show-config-test/gm, '"<<REPLACED_ROOT_DIR>>')
    .replaceAll(/"\S*\/jest\/packages/gm, '"<<REPLACED_JEST_PACKAGES_DIR>>')
    .replaceAll(/"seed": (-?\d+)/g, '"seed": <<RANDOM_SEED>>');

  expect(stdout).toMatchSnapshot();
});
