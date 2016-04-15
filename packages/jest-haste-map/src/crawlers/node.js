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
const glob = require('glob');
const path = require('../fastpath');

const statFile = denodeify(fs.stat);
const globPromise = denodeify(glob);

module.exports = function nodeCrawl(roots, extensions, ignorePattern, data) {
  const files = Object.create(null);
  const pattern =
    path.sep + '**' + path.sep + '*.{' + extensions.join(',') + '}';

  return Promise.all(roots.map(
    root => globPromise(root + pattern)
  )).then(list => {
    let promises = [];
    list.forEach(fileList => {
      promises = promises.concat(
        fileList.map(name =>
          statFile(name).then(stat => {
            if (!ignorePattern.test(name)) {
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
          })
        )
      );
    });
    return Promise.all(promises);
  }).then(() => {
    data.files = files;
    return data;
  });
};
