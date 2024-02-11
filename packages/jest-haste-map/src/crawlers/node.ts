/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {spawn} from 'child_process';
import * as path from 'path';
import * as fs from 'graceful-fs';
import H from '../constants';
import * as fastPath from '../lib/fast_path';
import type {
  CrawlerOptions,
  FileData,
  IgnoreMatcher,
  InternalHasteMap,
} from '../types';

type Result = Array<[/* id */ string, /* mtime */ number, /* size */ number]>;

type Callback = (result: Result) => void;

async function hasNativeFindSupport(
  forceNodeFilesystemAPI: boolean,
): Promise<boolean> {
  if (forceNodeFilesystemAPI) {
    return false;
  }

  try {
    return await new Promise(resolve => {
      // Check the find binary supports the non-POSIX -iname parameter wrapped in parens.
      const args = [
        '.',
        '-type',
        'f',
        '(',
        '-iname',
        '*.ts',
        '-o',
        '-iname',
        '*.js',
        ')',
      ];
      const child = spawn('find', args, {cwd: __dirname});
      child.on('error', () => {
        resolve(false);
      });
      child.on('exit', code => {
        resolve(code === 0);
      });
    });
  } catch {
    return false;
  }
}

function find(
  roots: Array<string>,
  extensions: Array<string>,
  ignore: IgnoreMatcher,
  enableSymlinks: boolean,
  callback: Callback,
): void {
  const result: Result = [];
  let activeCalls = 0;

  function search(directory: string): void {
    activeCalls++;
    fs.readdir(directory, {withFileTypes: true}, (err, entries) => {
      activeCalls--;
      if (err) {
        if (activeCalls === 0) {
          callback(result);
        }
        return;
      }
      for (const entry of entries) {
        const file = path.join(directory, entry.name);

        if (ignore(file)) {
          continue;
        }

        if (entry.isSymbolicLink()) {
          continue;
        }
        if (entry.isDirectory()) {
          search(file);
          continue;
        }

        activeCalls++;

        const stat = enableSymlinks ? fs.stat : fs.lstat;

        stat(file, (err, stat) => {
          activeCalls--;

          // This logic is unnecessary for node > v10.10, but leaving it in
          // since we need it for backwards-compatibility still.
          if (!err && stat && !stat.isSymbolicLink()) {
            if (stat.isDirectory()) {
              search(file);
            } else {
              const ext = path.extname(file).slice(1);
              if (extensions.includes(ext)) {
                result.push([file, stat.mtime.getTime(), stat.size]);
              }
            }
          }

          if (activeCalls === 0) {
            callback(result);
          }
        });
      }

      if (activeCalls === 0) {
        callback(result);
      }
    });
  }

  if (roots.length > 0) {
    for (const root of roots) search(root);
  } else {
    callback(result);
  }
}

function findNative(
  roots: Array<string>,
  extensions: Array<string>,
  ignore: IgnoreMatcher,
  enableSymlinks: boolean,
  callback: Callback,
): void {
  const args = [...roots];
  if (enableSymlinks) {
    args.push('(', '-type', 'f', '-o', '-type', 'l', ')');
  } else {
    args.push('-type', 'f');
  }

  if (extensions.length > 0) {
    args.push('(');
  }
  for (const [index, ext] of extensions.entries()) {
    if (index) {
      args.push('-o');
    }
    args.push('-iname', `*.${ext}`);
  }
  if (extensions.length > 0) {
    args.push(')');
  }

  const child = spawn('find', args);
  let stdout = '';
  if (child.stdout === null) {
    throw new Error(
      'stdout is null - this should never happen. Please open up an issue at https://github.com/jestjs/jest',
    );
  }
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', data => (stdout += data));

  child.stdout.on('close', () => {
    const lines = stdout
      .trim()
      .split('\n')
      .filter(x => !ignore(x));
    const result: Result = [];
    let count = lines.length;
    if (count) {
      for (const path of lines) {
        fs.stat(path, (err, stat) => {
          // Filter out symlinks that describe directories
          if (!err && stat && !stat.isDirectory()) {
            result.push([path, stat.mtime.getTime(), stat.size]);
          }
          if (--count === 0) {
            callback(result);
          }
        });
      }
    } else {
      callback([]);
    }
  });
}

export async function nodeCrawl(options: CrawlerOptions): Promise<{
  removedFiles: FileData;
  hasteMap: InternalHasteMap;
}> {
  const {
    data,
    extensions,
    forceNodeFilesystemAPI,
    ignore,
    rootDir,
    enableSymlinks,
    roots,
  } = options;

  const useNativeFind = await hasNativeFindSupport(forceNodeFilesystemAPI);

  return new Promise(resolve => {
    const callback = (list: Result) => {
      const files = new Map();
      const removedFiles = new Map(data.files);
      for (const fileData of list) {
        const [filePath, mtime, size] = fileData;
        const relativeFilePath = fastPath.relative(rootDir, filePath);
        const existingFile = data.files.get(relativeFilePath);
        if (existingFile && existingFile[H.MTIME] === mtime) {
          files.set(relativeFilePath, existingFile);
        } else {
          // See ../constants.js; SHA-1 will always be null and fulfilled later.
          files.set(relativeFilePath, ['', mtime, size, 0, '', null]);
        }
        removedFiles.delete(relativeFilePath);
      }
      data.files = files;

      resolve({
        hasteMap: data,
        removedFiles,
      });
    };

    if (useNativeFind) {
      findNative(roots, extensions, ignore, enableSymlinks, callback);
    } else {
      find(roots, extensions, ignore, enableSymlinks, callback);
    }
  });
}
