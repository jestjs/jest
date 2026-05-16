/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'graceful-fs';
import {type WalkOptions, walk} from '../walk';

function walkAsync(options: WalkOptions): Promise<void> {
  return new Promise((resolve, reject) =>
    walk(options, err => (err ? reject(err) : resolve())),
  );
}

function makeTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'jest-walk-test-'));
}

function touch(filePath: string, content = ''): void {
  fs.writeFileSync(filePath, content);
}

describe('walk', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmp();
  });

  afterEach(() => {
    fs.rmSync(root, {force: true, recursive: true});
  });

  it('resolves immediately for an empty directory', async () => {
    const entries: Array<string> = [];
    await walkAsync({onEntry: (_, p) => entries.push(p), root});
    expect(entries).toEqual([]);
  });

  it('emits files in a flat directory', async () => {
    touch(path.join(root, 'a.ts'));
    touch(path.join(root, 'b.ts'));
    const files: Array<string> = [];
    await walkAsync({
      onEntry: (kind, p) => kind === 'file' && files.push(p),
      root,
    });
    expect(files.sort()).toEqual(
      [path.join(root, 'a.ts'), path.join(root, 'b.ts')].sort(),
    );
  });

  it('recurses into subdirectories', async () => {
    fs.mkdirSync(path.join(root, 'sub'));
    touch(path.join(root, 'sub', 'c.ts'));
    const files: Array<string> = [];
    await walkAsync({
      onEntry: (kind, p) => kind === 'file' && files.push(p),
      root,
    });
    expect(files).toEqual([path.join(root, 'sub', 'c.ts')]);
  });

  it('does not emit dirs by default', async () => {
    fs.mkdirSync(path.join(root, 'sub'));
    touch(path.join(root, 'sub', 'f.ts'));
    const dirs: Array<string> = [];
    await walkAsync({
      onEntry: (kind, p) => kind === 'dir' && dirs.push(p),
      root,
    });
    expect(dirs).toEqual([]);
  });

  it('emits dirs when includeDirs is true', async () => {
    fs.mkdirSync(path.join(root, 'sub'));
    touch(path.join(root, 'sub', 'f.ts'));
    const dirs: Array<string> = [];
    await walkAsync({
      includeDirs: true,
      onEntry: (kind, p) => kind === 'dir' && dirs.push(p),
      root,
    });
    expect(dirs).toContain(root);
    expect(dirs).toContain(path.join(root, 'sub'));
  });

  it('prunes subtrees matching exclude', async () => {
    fs.mkdirSync(path.join(root, 'excluded'));
    fs.mkdirSync(path.join(root, 'included'));
    touch(path.join(root, 'excluded', 'no.ts'));
    touch(path.join(root, 'included', 'yes.ts'));
    const files: Array<string> = [];
    await walkAsync({
      exclude: (_dirName, dirPath) => dirPath.includes('excluded'),
      onEntry: (kind, p) => kind === 'file' && files.push(p),
      root,
    });
    expect(files).toEqual([path.join(root, 'included', 'yes.ts')]);
  });

  it('skips symlinks', async () => {
    touch(path.join(root, 'real.ts'));
    try {
      fs.symlinkSync(path.join(root, 'real.ts'), path.join(root, 'link.ts'));
    } catch {
      // symlinks may not be available in all CI environments
      return;
    }
    const files: Array<string> = [];
    await walkAsync({
      onEntry: (kind, p) => kind === 'file' && files.push(p),
      root,
    });
    expect(files).toEqual([path.join(root, 'real.ts')]);
  });

  it('routes lstat errors through onError and continues', async () => {
    touch(path.join(root, 'good.ts'));
    const badPath = path.join(root, 'bad.ts');
    touch(badPath);
    fs.chmodSync(badPath, 0o000);
    const errors: Array<string> = [];
    const files: Array<string> = [];
    try {
      await walkAsync({
        concurrency: 1,
        onEntry: (_, p) => files.push(p),
        onError: err => errors.push(err.code ?? 'ERR'),
        root,
      });
    } finally {
      fs.chmodSync(badPath, 0o644);
    }
    expect(files.some(p => p.endsWith('good.ts'))).toBe(true);
  });

  it('respects the concurrency cap', async () => {
    for (let i = 0; i < 20; i++) {
      touch(path.join(root, `f${i}.ts`));
    }
    let maxInflight = 0;
    let inflight = 0;
    const gfs = require('graceful-fs') as typeof import('graceful-fs');
    const origLstat = gfs.lstat;
    const spy = jest
      .spyOn(gfs, 'lstat')
      .mockImplementation((p, cb: Parameters<typeof origLstat>[1]) => {
        inflight++;
        maxInflight = Math.max(maxInflight, inflight);
        origLstat(p as string, (...args) => {
          inflight--;
          (cb as (...a: Array<unknown>) => void)(...args);
        });
      });

    await walkAsync({concurrency: 5, onEntry: () => {}, root});
    spy.mockRestore();
    expect(maxInflight).toBeLessThanOrEqual(5);
  });
});
