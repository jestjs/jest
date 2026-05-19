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
      exclude: dirPath => dirPath.includes('excluded'),
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
    // jest.spyOn on the graceful-fs module export doesn't reach walk.ts because
    // TypeScript's __importStar copies function references at module load time.
    // Use jest.doMock + fresh require so walk.ts loads with the patched lstat.
    jest.resetModules();

    const fakeError = Object.assign(new Error('EACCES'), {
      code: 'EACCES',
    }) as NodeJS.ErrnoException;
    jest.doMock('graceful-fs', () => {
      const real =
        jest.requireActual<typeof import('graceful-fs')>('graceful-fs');
      return {
        ...real,
        lstat(
          p: string,
          cb: (err: NodeJS.ErrnoException | null, stats?: fs.Stats) => void,
        ) {
          if (p.endsWith('bad.ts')) {
            setImmediate(() => cb(fakeError));
          } else {
            real.lstat(p, cb);
          }
        },
      };
    });

    const {walk: walkFresh} = require('../walk') as typeof import('../walk');

    touch(path.join(root, 'good.ts'));
    touch(path.join(root, 'bad.ts'));

    const errors: Array<string> = [];
    const files: Array<string> = [];
    await new Promise<void>((resolve, reject) =>
      walkFresh(
        {
          concurrency: 1,
          onEntry: (_, p) => files.push(p),
          onError: err => errors.push(err.code ?? 'ERR'),
          root,
        },
        err => (err ? reject(err) : resolve()),
      ),
    );

    jest.resetModules();

    expect(errors).toEqual(['EACCES']);
    expect(files.some(p => p.endsWith('good.ts'))).toBe(true);
  });

  it('returns cached Stats without re-statting when path is pre-populated', async () => {
    const filePath = path.join(root, 'a.ts');
    touch(filePath);

    const fakeStats = {
      isDirectory: () => false,
      mtime: new Date(0),
      size: 12_345,
    } as unknown as fs.Stats;
    const statCache = new Map([[filePath, fakeStats]]);

    const received = new Map<string, fs.Stats>();
    await walkAsync({
      onEntry: (_kind, p, stats) => received.set(p, stats),
      root,
      statCache,
    });

    // Exact same object reference — real lstat was never called for this path.
    expect(received.get(filePath)).toBe(fakeStats);
  });

  it('populates statCache on first walk so second walk gets same Stats object', async () => {
    const filePath = path.join(root, 'a.ts');
    touch(filePath);

    const statCache = new Map<string, fs.Stats>();

    let firstStats: fs.Stats | undefined;
    await walkAsync({
      onEntry: (_kind, p, stats) => {
        if (p === filePath) firstStats = stats;
      },
      root,
      statCache,
    });

    let secondStats: fs.Stats | undefined;
    await walkAsync({
      onEntry: (_kind, p, stats) => {
        if (p === filePath) secondStats = stats;
      },
      root,
      statCache,
    });

    // Second walk used the cache — same Stats object, no re-stat.
    expect(secondStats).toBe(firstStats);
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
