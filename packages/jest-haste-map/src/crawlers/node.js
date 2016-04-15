 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const denodeify = require('denodeify');
const fs = require('graceful-fs');
const path = require('../fastpath');

const statFile = denodeify(fs.stat);
const readDir = denodeify(fs.readdir);

function nodeCrawl(roots, extensions, ignorePattern, data) {
  const extensionsPattern = new RegExp('\.(' + extensions.join('|') + ')$');
  const files = Object.create(null);
  const queue = roots.slice();

  function search() {
    const root = queue.shift();
    if (!root) {
      return Promise.resolve();
    }

    return readDir(root)
      .then(files => files.map(f => path.join(root, f)))
      .then(files => Promise.all(
        files.map(
          f => statFile(f).catch(handleBrokenLink).then(stat => [f, stat])
        )
      ))
      .then(list => {
        list.forEach((fileData, i) => {
          const name = fileData[0];
          const stat = fileData[1];
          // Ignore broken links.
          if (!stat || ignorePattern.test(name)) {
            return;
          }

          if (stat.isDirectory()) {
            queue.push(name);
            return;
          }

          if (extensionsPattern.test(name)) {
            const mtime = stat.mtime.getTime();
            const existingFile = data.files[name];
            if (existingFile && existingFile.mtime === mtime) {
              //console.log('exists', name);
              files[name] = existingFile;
            } else {
              //console.log('add', name);
              files[name] = {
                id: null,
                mtime,
                visited: false,
              };
            }
          }
        });

        return search();
      });
  }

  return search().then(() => {
    data.files = files;
    return data;
  });
}

function handleBrokenLink(e) {
  console.warn('WARNING: error stating, possibly broken symlink', e.message);
  return Promise.resolve();
}

module.exports = nodeCrawl;
