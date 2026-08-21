/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {execFile} from 'node:child_process';
import * as net from 'node:net';
import * as path from 'node:path';
import {promisify} from 'node:util';
import type * as watchman from 'fb-watchman';
import * as fs from 'graceful-fs';
import {isError} from 'jest-util';

export type WatchmanAvailability = {
  installed: boolean;
  sockname: string | undefined;
};

const NOT_INSTALLED: WatchmanAvailability = {
  installed: false,
  sockname: undefined,
};

// Installed, but `get-sockname` failed. Attempting the crawl lets fb-watchman
// surface the failure through the existing warn-and-fall-back path.
const BROKEN: WatchmanAvailability = {installed: true, sockname: undefined};

// Codes `child_process` reports when the binary itself could not be started.
// Anything else, including a non-zero exit, means watchman is there but not
// answering, which is the `BROKEN` case.
const SPAWN_FAILURE_CODES = new Set(['EACCES', 'ENOENT', 'ENOTDIR', 'EPERM']);

let availabilityPromise: Promise<WatchmanAvailability> | undefined;

export function getWatchmanAvailability(
  cacheDirectory: string,
): Promise<WatchmanAvailability> {
  availabilityPromise ??= resolveAvailability(cacheDirectory);
  return availabilityPromise;
}

async function resolveAvailability(
  cacheDirectory: string,
): Promise<WatchmanAvailability> {
  const socknameFromEnv = process.env.WATCHMAN_SOCK;
  if (socknameFromEnv) {
    return {installed: true, sockname: socknameFromEnv};
  }

  const cacheFilePath = socknameCacheFilePath(cacheDirectory);
  const cachedSockname = readCachedSockname(cacheFilePath);
  if (cachedSockname !== undefined && (await canConnect(cachedSockname))) {
    return {installed: true, sockname: cachedSockname};
  }

  const availability = await runGetSockname();
  if (availability.sockname === undefined) {
    if (cachedSockname !== undefined) {
      removeCachedSockname(cacheFilePath);
    }
  } else {
    writeCachedSockname(cacheFilePath, availability.sockname);
  }
  return availability;
}

async function runGetSockname(): Promise<WatchmanAvailability> {
  let stdout: string;
  try {
    ({stdout} = await promisify(execFile)('watchman', [
      '--no-pretty',
      'get-sockname',
    ]));
  } catch (error) {
    if (isError(error) && isSpawnFailure(error)) {
      return NOT_INSTALLED;
    }
    return BROKEN;
  }

  try {
    const response = JSON.parse(stdout) as {sockname?: string; error?: string};
    if (typeof response.sockname === 'string' && response.error == null) {
      return {installed: true, sockname: response.sockname};
    }
  } catch {}
  return BROKEN;
}

/**
 * fb-watchman has no option for passing a known socket path; the only way to
 * skip its `get-sockname` child process is the `WATCHMAN_SOCK` environment
 * variable, which `Client.connect` reads synchronously. Set it just for that
 * synchronous window so no mutation is observable afterwards.
 */
export function connectClientToSockname(
  client: watchman.Client,
  sockname: string,
): void {
  const previousSockname = process.env.WATCHMAN_SOCK;
  process.env.WATCHMAN_SOCK = sockname;
  try {
    client.connect();
  } finally {
    if (previousSockname === undefined) {
      delete process.env.WATCHMAN_SOCK;
    } else {
      process.env.WATCHMAN_SOCK = previousSockname;
    }
  }
}

function isSpawnFailure(error: Error): boolean {
  const {code} = error as NodeJS.ErrnoException;
  return code !== undefined && SPAWN_FAILURE_CODES.has(code);
}

function socknameCacheFilePath(cacheDirectory: string): string {
  // The socket path is per-user, so two users sharing a cache directory need
  // separate entries. The name stays predictable, which means a local user can
  // pre-create it as a symlink and redirect the read and the write - the same
  // exposure every other file in this directory already has, since the cache
  // is written with plain `readFileSync`/`writeFileSync` too. Hardening one
  // file in isolation would not buy anything; it needs `CacheManager` as well.
  const userSuffix = process.getuid?.() ?? 'default';
  return path.join(cacheDirectory, `haste-map-watchman-sockname-${userSuffix}`);
}

function readCachedSockname(cacheFilePath: string): string | undefined {
  let sockname: string;
  try {
    sockname = fs.readFileSync(cacheFilePath, 'utf8').trim();
  } catch {
    return undefined;
  }
  return sockname.length > 0 ? sockname : undefined;
}

function writeCachedSockname(cacheFilePath: string, sockname: string): void {
  try {
    fs.writeFileSync(cacheFilePath, sockname);
  } catch {
    // The cache is best-effort; a failed write only costs the next run a
    // `get-sockname` spawn.
  }
}

function removeCachedSockname(cacheFilePath: string): void {
  try {
    fs.rmSync(cacheFilePath, {force: true});
  } catch {
    // `force` only ignores a missing file, so a read-only cache directory
    // still throws. Availability is resolved before the crawl starts, outside
    // the node-crawler fallback, so letting this escape would fail the run
    // over a cache entry.
  }
}

function canConnect(sockname: string): Promise<boolean> {
  return new Promise(resolve => {
    const socket = net.createConnection(sockname, () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}
