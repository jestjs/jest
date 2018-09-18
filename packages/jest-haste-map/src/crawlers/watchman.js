/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {InternalHasteMap} from 'types/HasteMap';
import type {CrawlerOptions} from '../types';

import * as fastPath from '../lib/fast_path';
import normalizePathSep from '../lib/normalize_path_sep';
import path from 'path';
import watchman from 'fb-watchman';
import H from '../constants';

const watchmanURL =
  'https://facebook.github.io/watchman/docs/troubleshooting.html';

// Matches symlinks in "node_modules" directories.
const nodeModules = ['**/node_modules/*', '**/node_modules/@*/*'];
const linkExpression = [
  'allof',
  ['type', 'l'],
  ['anyof'].concat(
    nodeModules.map(glob => [
      'match',
      glob,
      'wholename',
      {includedotfiles: true},
    ]),
  ),
];

function WatchmanError(error: Error): Error {
  error.message =
    `Watchman error: ${error.message.trim()}. Make sure watchman ` +
    `is running for this project. See ${watchmanURL}.`;
  return error;
}

module.exports = async function watchmanCrawl(
  options: CrawlerOptions,
): Promise<InternalHasteMap> {
  const fields = ['name', 'type', 'exists', 'mtime_ms'];
  const {data, extensions, ignore, rootDir, roots} = options;
  const fileExpression = [
    'allof',
    ['type', 'f'],
    ['anyof'].concat(extensions.map(extension => ['suffix', extension])),
  ];
  const clocks = data.clocks;
  const client = new watchman.Client();

  let clientError;
  client.on('error', error => (clientError = WatchmanError(error)));

  const cmd = (...args) =>
    new Promise((resolve, reject) =>
      client.command(
        args,
        (error, result) =>
          error ? reject(WatchmanError(error)) : resolve(result),
      ),
    );

  if (options.computeSha1) {
    const {capabilities} = await cmd('list-capabilities');

    if (capabilities.indexOf('field-content.sha1hex') !== -1) {
      fields.push('content.sha1hex');
    }
  }

  async function getWatchmanRoots(roots) {
    const watchmanRoots = new Map();
    await Promise.all(
      roots.map(async root => {
        const response = await cmd('watch-project', root);
        const existing = watchmanRoots.get(response.watch);
        // A root can only be filtered if it was never seen with a
        // relative_path before.
        const canBeFiltered = !existing || existing.length > 0;

        if (canBeFiltered) {
          if (response.relative_path) {
            watchmanRoots.set(
              response.watch,
              (existing || []).concat(response.relative_path),
            );
          } else {
            // Make the filter directories an empty array to signal that this
            // root was already seen and needs to be watched for all files or
            // directories.
            watchmanRoots.set(response.watch, []);
          }
        }
      }),
    );
    return watchmanRoots;
  }

  async function queryWatchmanForDirs(rootProjectDirMappings) {
    const files = new Map();
    let isFresh = false;
    await Promise.all(
      Array.from(rootProjectDirMappings).map(
        async ([root, directoryFilters]) => {
          let expression = ['anyof', fileExpression, linkExpression];
          const glob = [];

          if (directoryFilters.length > 0) {
            expression = [
              'allof',
              ['anyof'].concat(directoryFilters.map(dir => ['dirname', dir])),
              expression,
            ];

            for (const directory of directoryFilters) {
              glob.push(...nodeModules.map(glob => directory + '/' + glob));
              for (const extension of extensions) {
                glob.push(`${directory}/**/*.${extension}`);
              }
            }
          } else {
            glob.push(...nodeModules);
            for (const extension of extensions) {
              glob.push(`**/*.${extension}`);
            }
          }

          const relativeRoot = fastPath.relative(rootDir, root);
          const query = clocks.has(relativeRoot)
            ? // Use the `since` generator if we have a clock available
              {expression, fields, since: clocks.get(relativeRoot)}
            : // Otherwise use the `glob` filter
              {expression, fields, glob, glob_includedotfiles: true};

          const response = await cmd('query', root, query);

          if ('warning' in response) {
            console.warn('watchman warning: ', response.warning);
          }

          isFresh = isFresh || response.is_fresh_instance;
          files.set(root, response);
        },
      ),
    );

    return {
      files,
      isFresh,
    };
  }

  let files = data.files;
  let links = data.links;
  let watchmanFiles;
  try {
    const watchmanRoots = await getWatchmanRoots(roots);
    const watchmanFileResults = await queryWatchmanForDirs(watchmanRoots);

    // Reset the file map if watchman was restarted and sends us a list of
    // files.
    if (watchmanFileResults.isFresh) {
      files = new Map();
      links = new Map();
    }

    watchmanFiles = watchmanFileResults.files;
  } finally {
    client.end();
  }

  if (clientError) {
    throw clientError;
  }

  for (const [watchRoot, response] of watchmanFiles) {
    const fsRoot = normalizePathSep(watchRoot);
    const relativeFsRoot = fastPath.relative(rootDir, fsRoot);
    clocks.set(relativeFsRoot, response.clock);

    for (const fileData of response.files) {
      const filePath = fsRoot + path.sep + normalizePathSep(fileData.name);
      const fileName = fastPath.relative(rootDir, filePath);

      const cache: Map<string, any> = fileData.type === 'f' ? files : links;
      if (!fileData.exists) {
        cache.delete(filePath);
      } else if (!ignore(filePath)) {
        const mtime =
          typeof fileData.mtime_ms === 'number'
            ? fileData.mtime_ms
            : fileData.mtime_ms.toNumber();

        let sha1hex = fileData['content.sha1hex'];
        if (typeof sha1hex !== 'string' || sha1hex.length !== 40) {
          sha1hex = null;
        }

        const existingFileData: any =
          fileData.type === 'f'
            ? data.files.get(fileName)
            : data.links.get(fileName);

        if (existingFileData && existingFileData[H.MTIME] === mtime) {
          cache.set(fileName, existingFileData);
        } else if (fileData.type !== 'f') {
          cache.set(fileName, [undefined, mtime]);
        } else if (
          sha1hex &&
          existingFileData &&
          existingFileData[H.SHA1] === sha1hex
        ) {
          cache.set(fileName, [
            existingFileData[0],
            mtime,
            existingFileData[2],
            existingFileData[3],
            existingFileData[4],
          ]);
        } else {
          cache.set(fileName, ['', mtime, 0, [], sha1hex]);
        }
      }
    }
  }

  data.files = files;
  data.links = links;
  return data;
};
