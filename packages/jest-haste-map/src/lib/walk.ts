/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'node:os';
import {fdir as Fdir, type Options as FdirOptions} from 'fdir';
import * as fs from 'graceful-fs';

export type WalkEntryKind = 'file' | 'dir';

const DEFAULT_CONCURRENCY = Math.max(os.availableParallelism() * 4, 32);
// fdir returns directory paths with a trailing separator; strip it.
const TRAILING_SEP_RE = /[/\\]+$/;

export interface WalkOptions extends Pick<FdirOptions, 'includeDirs'> {
  root: string;
  concurrency?: number;
  enableSymlinks?: boolean;
  exclude?: (dirPath: string) => boolean;
  onEntry: (kind: WalkEntryKind, filePath: string, stats: fs.Stats) => void;
  onError?: (err: NodeJS.ErrnoException) => void;
}

export function walk(
  options: WalkOptions,
  done: (err: Error | null) => void,
): void {
  const {
    concurrency = DEFAULT_CONCURRENCY,
    enableSymlinks = false,
    exclude,
    onEntry,
    onError,
    root,
    ...fdirOpts
  } = options;

  const builder = new Fdir({
    ...fdirOpts,
    // fdir passes dirPath with a trailing separator; strip it before delegating.
    exclude: exclude
      ? (_dirName: string, dirPath: string) =>
          exclude(dirPath.replace(TRAILING_SEP_RE, ''))
      : undefined,
    excludeSymlinks: !enableSymlinks,
    fs,
    includeBasePath: true,
    // resolveSymlinks: false — `fdir`'s resolveSymlinks calls realpath and emits
    // the resolved path, losing the original symlink path. haste-map must track
    // files under the path Jest uses to require them (the symlink path), so we
    // keep the original path and use fs.stat to follow the symlink for stats.
    resolveSymlinks: false,
  });

  const statFn = enableSymlinks ? fs.stat : fs.lstat;

  builder.crawl(root).withCallback((crawlErr, rawPaths) => {
    if (crawlErr != null) {
      done(crawlErr);
      return;
    }

    let index = 0;
    let inflight = 0;
    let finished = false;

    function pump() {
      while (inflight < concurrency && index < rawPaths.length) {
        const filePath = rawPaths[index++].replace(TRAILING_SEP_RE, '');
        inflight++;
        statFn(filePath, (err, stats) => {
          inflight--;
          if (err) {
            onError?.(err);
          } else {
            onEntry(stats.isDirectory() ? 'dir' : 'file', filePath, stats);
          }
          if (index < rawPaths.length) {
            pump();
          } else if (inflight === 0 && !finished) {
            finished = true;
            done(null);
          }
        });
      }
      if (inflight === 0 && !finished) {
        finished = true;
        done(null);
      }
    }

    pump();
  });
}
