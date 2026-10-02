/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
import type {Config} from '@jest/types';
import type Runtime from '..';

jest.mock('graceful-fs', () => {
  const actual =
    jest.requireActual<typeof import('graceful-fs')>('graceful-fs');
  return {...actual, readFileSync: jest.fn(actual.readFileSync)};
});

let createRuntime: (
  path: string,
  config?: Config.InitialOptions,
) => Promise<Runtime & {__mockRootPath: string}>;
let directory: string;

// Every runtime gets its own `cacheFS`, the way every test file in a worker
// does, while the script transformer's in-memory results live for the worker.
const requireInNewRuntime = async (modulePath: string) => {
  const runtime = await createRuntime(__filename, {transform: {}});
  return runtime.requireModule<string>(runtime.__mockRootPath, modulePath);
};

const sourceReadsOf = (file: string) =>
  jest
    .mocked(fs.readFileSync)
    .mock.calls.filter(([readPath]) => readPath === file).length;

describe('Runtime source reads', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
    directory = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'jest-runtime-source-reads-')),
    );
  });

  afterEach(() => {
    fs.rmSync(directory, {force: true, recursive: true});
  });

  it('reads a module once for two test files that require it', async () => {
    const modulePath = path.join(directory, 'shared.js');
    fs.writeFileSync(modulePath, "module.exports = 'shared';\n");

    await expect(requireInNewRuntime(modulePath)).resolves.toBe('shared');
    await expect(requireInNewRuntime(modulePath)).resolves.toBe('shared');

    expect(sourceReadsOf(modulePath)).toBe(1);
  });

  it('reads a module again after it changes on disk', async () => {
    const modulePath = path.join(directory, 'changing.js');
    fs.writeFileSync(modulePath, "module.exports = 'before';\n");

    await expect(requireInNewRuntime(modulePath)).resolves.toBe('before');

    fs.writeFileSync(modulePath, "module.exports = 'after';\n");
    // The transformer keys its results on the mtime, which a rewrite within
    // the same millisecond would not move.
    const later = new Date(Date.now() + 60_000);
    fs.utimesSync(modulePath, later, later);

    await expect(requireInNewRuntime(modulePath)).resolves.toBe('after');
    expect(sourceReadsOf(modulePath)).toBe(2);
  });
});
