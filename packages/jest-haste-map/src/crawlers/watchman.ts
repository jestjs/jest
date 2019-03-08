/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs';
import path from 'path';
import {sync as realpath} from 'realpath-native';
import watchman from 'fb-watchman';
import {Config} from '@jest/types';
import * as fastPath from '../lib/fast_path';
import normalizePathSep from '../lib/normalizePathSep';
import H from '../constants';
import {
  InternalHasteMap,
  CrawlerOptions,
  FileMetaData,
  FileData,
  LinkMetaData,
} from '../types';

type WatchmanRoots = Map<string, Array<string>>;

const watchmanURL =
  'https://facebook.github.io/watchman/docs/troubleshooting.html';

// Matches symlinks in "node_modules" directories.
const nodeModulesExpression = [
  'allof',
  ['type', 'l'],
  [
    'anyof',
    ...['**/node_modules/*', '**/node_modules/@*/*'].map(glob => [
      'match',
      glob,
      'wholename',
      {includedotfiles: true},
    ]),
  ],
];

const NODE_MODULES = path.sep + 'node_modules' + path.sep;

function WatchmanError(error: Error): Error {
  error.message =
    `Watchman error: ${error.message.trim()}. Make sure watchman ` +
    `is running for this project. See ${watchmanURL}.`;
  return error;
}

export = async function watchmanCrawl(
  options: CrawlerOptions,
): Promise<{
  changedFiles?: FileData;
  removedFiles: FileData;
  hasteMap: InternalHasteMap;
}> {
  const {data, extensions, ignore, rootDir} = options;
  const client = new watchman.Client();

  let clientError;
  client.on('error', error => (clientError = WatchmanError(error)));

  // TODO: type better than `any`
  const cmd = (...args: Array<any>): Promise<any> =>
    new Promise((resolve, reject) =>
      client.command(args, (error, result) =>
        error ? reject(WatchmanError(error)) : resolve(result),
      ),
    );

  type WatchmanFile = {
    name: string;
    exists: boolean;
    mtime_ms: number;
    size: number;
    type: string;
    'content.sha1hex'?: string;
  };

  const fields = ['name', 'exists', 'mtime_ms', 'size', 'type'];
  if (options.computeSha1) {
    const {capabilities} = await cmd('list-capabilities');
    if (capabilities.includes('field-content.sha1hex')) {
      fields.push('content.sha1hex');
    }
  }

  // Clone the clockspec cache to avoid mutations during the watch phase.
  const clocks = new Map(data.clocks);

  /**
   * Fetch an array of files that match the given expression and are contained
   * by the given `watchRoot` (with directory filters applied).
   *
   * When the `watchRoot` has a cached Watchman clockspec, only changed files
   * are returned. The cloned clockspec cache is updated on every query.
   *
   * The given `watchRoot` must be absolute.
   */
  const queryRequest = async (
    watchRoot: Config.Path,
    dirs: Array<string>,
    expression: Array<any>,
  ) => {
    if (dirs.length) {
      expression = [
        'allof',
        ['anyof', ...dirs.map(dir => ['dirname', dir])],
        expression,
      ];
    }

    const relativeRoot = fastPath.relative(rootDir, watchRoot) || '.';
    const response = await cmd('query', watchRoot, {
      expression,
      fields,
      // Use the cached clockspec since `queryRequest` is called twice per root.
      since: data.clocks.get(relativeRoot),
    });

    if ('warning' in response) {
      console.warn('watchman warning:', response.warning);
    }

    clocks.set(relativeRoot, response.clock);
    return response;
  };

  // The cached array of project roots.
  const roots: Config.Path[] = [];
  const isValidRoot = (root: Config.Path) =>
    !root.includes(NODE_MODULES) &&
    !roots.includes(root) &&
    !roots.find(root => root.startsWith(root + path.sep));

  // Ensure every configured root is valid.
  options.roots
    .map(root => realpath(root))
    .sort((a, b) => a.length - b.length)
    .forEach(root => {
      if (isValidRoot(root)) {
        roots.push(root);
      }
    });

  // Ensure every linked root is searched if valid.
  data.roots.forEach(root => {
    root = path.resolve(rootDir, root);
    if (isValidRoot(root)) {
      try {
        if (fs.statSync(root).isDirectory()) {
          roots.push(root);
        }
      } catch (e) {}
    }
  });

  // Track which directories share a "watch root" (a common ancestor identified
  // by Watchman). Use an empty array to denote a project root that is its own
  // watch root. These arrays are used as "directory filters" in the 2nd phase.
  const watched = new Map<Config.Path, string[]>();

  // Store newfound dependency links in a local variable until the crawl phase,
  // which is when we can know if Watchman is a fresh instance.
  const dependencyLinks = new Map<Config.Path, LinkMetaData>();

  /**
   * Look for linked dependencies in every "node_modules" directory within the
   * given root. Repeat for every linked dependency found that resolves to a
   * directory which exists outside of all known project roots.
   */
  const findDependencyLinks = async (root: Config.Path) => {
    const response = await cmd('watch-project', root);
    const watchRoot = normalizePathSep(response.watch);

    let dirs = watched.get(watchRoot);
    if (!dirs) {
      watched.set(watchRoot, (dirs = []));
    } else if (!dirs.length) {
      return; // Ensure no directory filters are used.
    }

    const dir = normalizePathSep(response.relative_path || '');
    if (dir) {
      if (dirs.includes(dir)) {
        return; // Avoid crawling the same directory twice.
      }
      dirs.push(dir);
    } else {
      // Ensure no directory filters are used.
      dirs.length = 0;
    }

    // Search every "node_modules" directory in the entire tree.
    // It should be faster for Watchman to do this in one fell swoop.
    const queryResponse = await queryRequest(
      watchRoot,
      dir ? [dir] : [],
      nodeModulesExpression,
    );

    await Promise.all(
      queryResponse.files.map(async (link: WatchmanFile) => {
        const name = normalizePathSep(link.name);
        const linkPath = path.join(watchRoot, name);
        const relativePath = fastPath.relative(rootDir, linkPath);

        if (!link.exists || ignore(linkPath)) {
          data.links.delete(relativePath);
          return;
        }

        let target;
        try {
          target = realpath(linkPath);
        } catch (e) {
          return; // Skip broken symlinks.
        }

        const metaData = data.links.get(relativePath);
        const mtime = testModified(metaData, link.mtime_ms);
        dependencyLinks.set(
          relativePath,
          mtime !== 0 ? [target, mtime] : metaData!,
        );

        if (fs.statSync(target).isDirectory() && isValidRoot(target)) {
          roots.push(target);
          await findDependencyLinks(target);
        }
      }),
    );
  };

  let isFresh = false;
  let removedFiles = new Map();
  const changedFiles = new Map();
  try {
    await Promise.all(roots.map(findDependencyLinks));

    const crawlExpression = [
      'anyof',
      ['type', 'l'],
      [
        'allof',
        ['type', 'f'],
        ['anyof', ...extensions.map(extension => ['suffix', extension])],
      ],
    ];

    const watchRoots = Array.from(watched.keys());
    const crawled = await Promise.all(
      watchRoots.map(async watchRoot => {
        const queryResponse = await queryRequest(
          watchRoot,
          watched.get(watchRoot)!,
          crawlExpression,
        );
        if (!isFresh) {
          isFresh = queryResponse.is_fresh_instance;
        }
        return queryResponse.files;
      }),
    );

    // Reset the file map if Watchman refreshed.
    if (isFresh) {
      removedFiles = new Map(data.files);
      data.files = new Map();
      data.links = dependencyLinks;
    } else {
      dependencyLinks.forEach((link, linkPath) => {
        data.links.set(linkPath, link);
      });
    }

    // Update the file map and symlink map.
    crawled.forEach((files: WatchmanFile[], i) => {
      const watchRoot = watchRoots[i];
      for (const file of files) {
        const name = normalizePathSep(file.name);
        const filePath = path.join(watchRoot, name);
        const relativeFilePath = fastPath.relative(rootDir, filePath);
        const isLinked = file.type === 'l';

        const existingFiles: Map<string, any> = isLinked
          ? data.links
          : data.files;

        const existingFile = existingFiles.get(relativeFilePath);
        if (isFresh && existingFile && file.exists) {
          // If watchman is fresh, the removed files map starts with all files
          // and we remove them as we verify they still exist.
          removedFiles.delete(relativeFilePath);
        }

        if (!file.exists || ignore(filePath)) {
          // No need to act on files that do not exist and were not tracked.
          if (existingFile) {
            existingFiles.delete(relativeFilePath);

            // If watchman is not fresh, we will know what specific files were
            // deleted since we last ran and can track only those files.
            if (!isFresh) {
              removedFiles.set(relativeFilePath, existingFile);
            }
          }
          continue;
        }

        let sha1hex = file['content.sha1hex'] || null;
        if (sha1hex && sha1hex.length !== 40) {
          sha1hex = null;
        }

        const mtime = testModified(existingFile, file.mtime_ms);
        if (mtime !== 0) {
          if (isLinked) {
            // See ../constants.ts
            existingFiles.set(relativeFilePath, [undefined, mtime]);
            continue;
          }

          let nextData: FileMetaData;
          if (sha1hex && existingFile && existingFile[H.SHA1] === sha1hex) {
            nextData = [
              existingFile[0],
              mtime,
              existingFile[2],
              existingFile[3],
              existingFile[4],
              existingFile[5],
            ];
          } else {
            // See ../constants.ts
            nextData = ['', mtime, file.size, 0, '', sha1hex];
          }

          const mappings = options.mapper ? options.mapper(filePath) : null;

          if (mappings) {
            for (const absoluteVirtualFilePath of mappings) {
              if (!ignore(absoluteVirtualFilePath)) {
                const relativeVirtualFilePath = fastPath.relative(
                  rootDir,
                  absoluteVirtualFilePath,
                );
                data.files.set(relativeVirtualFilePath, nextData);
                changedFiles.set(relativeVirtualFilePath, nextData);
              }
            }
          } else {
            data.files.set(relativeFilePath, nextData);
            changedFiles.set(relativeFilePath, nextData);
          }
        }
      }
    });
  } finally {
    client.end();
  }
  if (clientError) {
    throw clientError;
  }

  data.roots = roots.map(root => fastPath.relative(rootDir, root));
  data.clocks = clocks;
  return {
    changedFiles: isFresh ? undefined : changedFiles,
    hasteMap: data,
    removedFiles,
  };
};

/**
 * Check if the file data has been modified since last cached.
 *
 * Returns the 2nd argument if modified, else zero.
 */
function testModified(
  metaData: FileMetaData | LinkMetaData | undefined,
  mtime: number | {toNumber(): number},
) {
  if (typeof mtime !== 'number') {
    mtime = mtime.toNumber();
  }
  return !metaData || metaData[H.MTIME] !== mtime ? mtime : 0;
}
