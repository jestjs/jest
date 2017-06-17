/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {InternalHasteMap} from 'types/HasteMap';
import type {CrawlerOptions} from '../types';

import path from 'path';
import watchman from 'fb-watchman';
import H from '../constants';

const watchmanURL =
  'https://facebook.github.io/watchman/docs/troubleshooting.html';

function isDescendant(root: string, child: string): boolean {
  return child.startsWith(root);
}

function WatchmanError(error: Error): Error {
  return new Error(
    `Watchman error: ${error.message.trim()}. Make sure watchman ` +
      `is running for this project. See ${watchmanURL}.`,
  );
}

module.exports = function watchmanCrawl(
  options: CrawlerOptions,
): Promise<InternalHasteMap> {
  const {data, extensions, ignore, roots} = options;

  return new Promise((resolve, reject) => {
    const client = new watchman.Client();
    client.on('error', error => reject(error));

    const cmd = args =>
      new Promise((resolve, reject) => {
        client.command(args, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });

    const clocks = data.clocks;
    let files = data.files;

    return Promise.all(roots.map(root => cmd(['watch-project', root])))
      .then(responses => {
        const watchmanRoots = Array.from(
          new Set(responses.map(response => response.watch)),
        );
        return Promise.all(
          watchmanRoots.map(root => {
            // Build an expression to filter the output by the relevant roots.
            const dirExpr = (['anyof']: Array<string | Array<string>>);
            roots.forEach(subRoot => {
              if (isDescendant(root, subRoot)) {
                dirExpr.push(['dirname', path.relative(root, subRoot)]);
              }
            });
            const expression = [
              'allof',
              ['type', 'f'],
              ['anyof'].concat(
                extensions.map(extension => ['suffix', extension]),
              ),
            ];
            if (dirExpr.length > 1) {
              expression.push(dirExpr);
            }
            const fields = ['name', 'exists', 'mtime_ms'];

            const query = clocks[root]
              ? // Use the `since` generator if we have a clock available
                {expression, fields, since: clocks[root]}
              : // Otherwise use the `suffix` generator
                {expression, fields, suffix: extensions};
            return cmd(['query', root, query]).then(response => ({
              response,
              root,
            }));
          }),
        ).then(pairs => {
          // Reset the file map if watchman was restarted and sends us a list of
          // files.
          if (pairs.some(pair => pair.response.is_fresh_instance)) {
            files = Object.create(null);
          }

          pairs.forEach(pair => {
            const root = pair.root;
            const response = pair.response;
            if ('warning' in response) {
              console.warn('watchman warning: ', response.warning);
            }

            clocks[root] = response.clock;
            response.files.forEach(fileData => {
              const name = root + path.sep + fileData.name;
              if (!fileData.exists) {
                delete files[name];
              } else if (!ignore(name)) {
                const mtime = typeof fileData.mtime_ms === 'number'
                  ? fileData.mtime_ms
                  : fileData.mtime_ms.toNumber();
                const isNew =
                  !data.files[name] || data.files[name][H.MTIME] !== mtime;
                if (isNew) {
                  // See ../constants.js
                  files[name] = ['', mtime, 0, []];
                } else {
                  files[name] = data.files[name];
                }
              }
            });
          });
        });
      })
      .then(() => {
        client.end();
        data.files = files;
        resolve(data);
      })
      .catch(error => {
        client.end();
        reject(WatchmanError(error));
      });
  });
};
