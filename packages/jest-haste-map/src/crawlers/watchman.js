 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const H = require('../constants');

const path = require('../fastpath');
const watchman = require('fb-watchman');

const watchmanURL = 'https://facebook.github.io/watchman/docs/troubleshooting.html';

function isDescendant(root, child) {
  return child.startsWith(root);
}

function WatchmanError(error) {
  return new Error(
    `Watchman error: ${error.message.trim()}. Make sure watchman ` +
    `is running for this project. See ${watchmanURL}.`
  );
}

module.exports = function watchmanCrawl(roots, extensions, ignore, data) {
  return new Promise((resolve, reject) => {
    const client = new watchman.Client();
    client.on('error', error => reject(error));

    const cmd = args => new Promise((resolve, reject) => {
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
          new Set(responses.map(response => response.watch))
        );
        return Promise.all(watchmanRoots.map(root => {
          // Build up an expression to filter the output by the relevant roots.
          const dirExpr = ['anyof'];
          roots.forEach(subRoot => {
            if (isDescendant(root, subRoot)) {
              dirExpr.push(['dirname', path.relative(root, subRoot)]);
            }
          });
          const query = {
            expression: [
              'allof',
              ['type', 'f'],
              ['anyof'].concat(extensions.map(
                extension => ['suffix', extension]
              )),
              dirExpr,
            ],
            fields: ['name', 'exists', 'mtime_ms'],
          };
          if (clocks[root]) {
            // Use the `since` generator if we have a clock available
            query.since = clocks[root];
          } else {
            // Otherwise use the `suffix` generator
            query.suffix = extensions;
          }
          return cmd(['query', root, query]).then(response => ({
            root,
            response,
          }));
        })).then(pairs => {
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
                const mtime = fileData.mtime_ms.toNumber();
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
