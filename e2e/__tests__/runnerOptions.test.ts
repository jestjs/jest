/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import * as path from 'path';
import runJest from '../runJest';

const dir = path.resolve(__dirname, '../runner-options');
const optionsFile = path.join(dir, 'runner-options-received.json');

afterEach(() => {
  if (fs.existsSync(optionsFile)) {
    fs.unlinkSync(optionsFile);
  }
});

describe('runner with options (tuple config)', () => {
  it('passes options to the runner constructor', () => {
    const result = runJest(dir);
    expect(result.exitCode).toBe(0);

    const receivedOptions = JSON.parse(fs.readFileSync(optionsFile, 'utf8'));
    expect(receivedOptions).toEqual({count: 42, myOption: 'hello'});
  });
});
