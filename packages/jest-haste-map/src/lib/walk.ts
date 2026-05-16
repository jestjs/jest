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
  exclude?: (path: string) => boolean;
  onEntry: (kind: WalkEntryKind, filePath: string, stats: fs.Stats) => void;
  onError?: (err: NodeJS.ErrnoException) => void;
  // Optional stat cache shared across multiple walk() calls (e.g. one per root
  // in find()). A path already in the cache skips the lstat syscall. Hits are
  // best-effort: concurrent walks may both miss the same path if neither has
  // completed its lstat before the other checks. Must NOT be passed to runtime
  // (post-startup) walks — stale cached stats would be returned for changed files.
  statCache?: Map<string, fs.Stats>;
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
    statCache,
    ...fdirOpts
  } = options;

  // Wrap exclude to strip fdir's trailing path separator before delegating.
  const normalizedExclude = exclude
    ? (p: string) => exclude(p.replace(TRAILING_SEP_RE, ''))
    : undefined;

  const builder = new Fdir({
    ...fdirOpts,
    // Used for directory pruning (prevents fdir from recursing into subtrees).
    // fdir calls exclude(dirName, dirPath) — dirName is the basename and dirPath
    // is the full path, so dirName is unused (it's a subset of dirPath).
    exclude: normalizedExclude
      ? (_dirName: string, dirPath: string) => normalizedExclude(dirPath)
      : undefined,
    excludeSymlinks: !enableSymlinks,
    // Also used as an output filter so ignored paths never enter the stat pool.
    // Applies to both file and dir entries (dirs also have a trailing sep, hence
    // the shared normalizedExclude that strips it). fdir includes entries where
    // the filter returns true, so we negate: include when NOT excluded.
    filters: normalizedExclude ? [path => !normalizedExclude(path)] : [],
    fs,
    includeBasePath: true,
    // resolveSymlinks: false — `fdir`'s resolveSymlinks calls realpath and emits
    // the resolved path, losing the original symlink path. haste-map must track
    // files under the path Jest uses to require them (the symlink path), so we
    // keep the original path and use fs.stat to follow the symlink for stats.
    resolveSymlinks: false,
    // Unreadable directories are skipped and the walk continues with partial
    // results.
    suppressErrors: true,
  });

  const statFn = enableSymlinks ? fs.stat : fs.lstat;

  builder.crawl(root).withCallback((crawlErr, rawPaths) => {
    // suppressErrors: true means crawlErr is always null, but keep the guard
    // as a safety net in case fdir's default changes.
    /* c8 ignore next 4 */
    if (crawlErr != null) {
      done(crawlErr);
      return;
    }

    // Two-phase design (readdir-all via fdir, then stat-all here): fdir does not
    // stat during the crawl. Pipelining lstat with readdir would not improve
    // throughput on large repos anyway — both share libuv's thread pool, which
    // the concurrent readdir calls already saturate.
    let index = 0;
    let inflight = 0;
    // Prevent done() being called twice: once from the last stat callback and
    // once from the post-while guard when concurrency > remaining paths.
    let finished = false;

    function pump() {
      while (inflight < concurrency && index < rawPaths.length) {
        const filePath = rawPaths[index++].replace(TRAILING_SEP_RE, '');
        const cached = statCache?.get(filePath);
        if (cached != null) {
          onEntry(cached.isDirectory() ? 'dir' : 'file', filePath, cached);
          continue;
        }
        inflight++;
        statFn(filePath, (err, stats) => {
          inflight--;
          if (err) {
            onError?.(err);
          } else {
            statCache?.set(filePath, stats);
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
