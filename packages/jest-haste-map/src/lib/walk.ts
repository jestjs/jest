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

export interface WalkOptions extends Pick<
  FdirOptions,
  'exclude' | 'includeDirs'
> {
  root: string;
  concurrency?: number;
  onEntry: (kind: WalkEntryKind, filePath: string, stats: fs.Stats) => void;
  onError?: (err: NodeJS.ErrnoException) => void;
}

export function walk(
  options: WalkOptions,
  done: (err: Error | null) => void,
): void {
  const {
    concurrency = DEFAULT_CONCURRENCY,
    onEntry,
    onError,
    root,
    ...fdirOpts
  } = options;

  const builder = new Fdir({
    ...fdirOpts,
    excludeSymlinks: true,
    fs,
    includeBasePath: true,
  });

  const statFn = fs.lstat;

  builder.crawl(root).withCallback((crawlErr, rawPaths) => {
    if (crawlErr != null) {
      done(crawlErr);
      return;
    }

    let index = 0;
    let inflight = 0;

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
          } else if (inflight === 0) {
            done(null);
          }
        });
      }
      if (inflight === 0) {
        done(null);
      }
    }

    pump();
  });
}
