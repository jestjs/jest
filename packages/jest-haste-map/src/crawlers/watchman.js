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

import normalizePathSep from '../lib/normalize_path_sep';
import path from 'path';
import watchman from 'fb-watchman';
import H from '../constants';

const watchmanURL =
  'https://facebook.github.io/watchman/docs/troubleshooting.html';

function WatchmanError(error: Error): Error {
  error.message =
    `Watchman error: ${error.message.trim()}. Make sure watchman ` +
    `is running for this project. See ${watchmanURL}.`;
  return error;
}

module.exports = async function watchmanCrawl(
  options: CrawlerOptions,
): Promise<InternalHasteMap> {
  const {data, extensions, ignore, roots} = options;
  const defaultWatchExpression = [
    'allof',
    ['type', 'f'],
    ['anyof'].concat(extensions.map(extension => ['suffix', extension])),
  ];
  const client = new watchman.Client();
  let clientError;
  client.on('error', error => (clientError = error));

  const cmd = (...args) =>
    new Promise((resolve, reject) =>
      client.command(
        args,
        (error, result) => (error ? reject(error) : resolve(result)),
      ),
    );

  const clocks = data.clocks;
  let files = data.files;

  try {
    const watchmanRoots = new Map();
    for (const root of roots) {
      const response = await cmd('watch-project', root);
      const existing = watchmanRoots.get(response.watch);
      // A root can only be filtered if it was never seen with a relative_path before
      const canBeFiltered = !existing || existing.length > 0;

      if (canBeFiltered) {
        if (response.relative_path) {
          watchmanRoots.set(
            response.watch,
            (existing || []).concat(response.relative_path),
          );
        } else {
          // Make the filter directories an empty array to signal that this root
          // was already seen and needs to be watched for all files/directories
          watchmanRoots.set(response.watch, []);
        }
      }
    }

    let shouldReset = false;
    const watchmanFileResults = new Map();
    for (const [root, directoryFilters] of watchmanRoots) {
      const expression = Array.from(defaultWatchExpression);
      if (directoryFilters.length > 0) {
        expression.push([
          'anyof',
          ...directoryFilters.map(dir => ['dirname', dir]),
        ]);
      }
      const fields = ['name', 'exists', 'mtime_ms'];

      const query = clocks[root]
        ? // Use the `since` generator if we have a clock available
          {expression, fields, since: clocks[root]}
        : // Otherwise use the `suffix` generator
          {expression, fields, suffix: extensions};

      const response = await cmd('query', root, query);
      shouldReset = shouldReset || response.is_fresh_instance;
      watchmanFileResults.set(root, response);
    }

    // Reset the file map if watchman was restarted and sends us a list of files.
    if (shouldReset) {
      files = Object.create(null);
    }

    for (const [watchRoot, response] of watchmanFileResults) {
      const fsRoot = normalizePathSep(watchRoot);
      if ('warning' in response) {
        console.warn('watchman warning: ', response.warning);
      }
      clocks[fsRoot] = response.clock;
      for (const fileData of response.files) {
        const name = fsRoot + path.sep + normalizePathSep(fileData.name);
        if (!fileData.exists) {
          delete files[name];
        } else if (!ignore(name)) {
          const mtime =
            typeof fileData.mtime_ms === 'number'
              ? fileData.mtime_ms
              : fileData.mtime_ms.toNumber();
          const isOld = data.files[name] && data.files[name][H.MTIME] === mtime;
          if (isOld) {
            files[name] = data.files[name];
          } else {
            // See ../constants.js
            files[name] = ['', mtime, 0, []];
          }
        }
      }
    }
  } catch (error) {
    throw WatchmanError(error);
  } finally {
    client.end();
  }

  if (clientError) {
    throw WatchmanError(clientError);
  }
  data.files = files;
  return data;
};
