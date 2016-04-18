 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const spawn = require('child_process').spawn;

function find(roots, extensions, ignorePattern, callback) {
  const result = [];
  let activeCalls = 0;

  function search(curDir) {
    activeCalls++;
    fs.readdir(curDir, (err, names) => {
      activeCalls--;

      for (let i = 0; i < names.length; i++) {
        names[i] = path.join(curDir, names[i]);
      }

      names.forEach(file => {
        if (ignorePattern.test(file)) {
          return;
        }
        activeCalls++;

        fs.lstat(file, (err, stat) => {
          activeCalls--;

          if (!err && stat && !stat.isSymbolicLink()) {
            if (stat.isDirectory()) {
              search(file);
            } else {
              const ext = path.extname(file).substr(1);
              if (extensions.indexOf(ext) !== -1) {
                result.push([file, stat.mtime.getTime()]);
              }
            }
          }
          if (activeCalls === 0) {
            callback(result);
          }
        });
      });

      if (activeCalls === 0) {
        callback(result);
      }
    });
  }

  roots.forEach(search);
}

function findNative(roots, extensions, ignorePattern, callback) {
  const args = [].concat(roots);
  args.push('-type', 'f');
  extensions.forEach((ext, index) => {
    if (index) {
      args.push('-o');
    }
    args.push('-iname');
    args.push('*' + ext);
  });

  const child = spawn('find', args);
  let stdout = '';
  child.stdout.setEncoding('utf-8');
  child.stdout.on('data', data => stdout += data);

  child.stdout.on('close', code => {
    const lines = stdout.trim()
      .split('\n')
      .filter(x => !ignorePattern.test(x));
    const result = [];
    let count = lines.length;
    lines.forEach(path => {
      fs.stat(path, (err, stat) => {
        if (stat && !stat.isDirectory()) {
          result.push([path, stat.mtime.getTime()]);
        }
        if (--count === 0) {
          callback(result);
        }
      });
    });
  });
}

module.exports = function nodeCrawl(roots, extensions, ignorePattern, data) {
  return new Promise(resolve => {
    const callback = list => {
      const files = Object.create(null);
      list.forEach(fileData => {
        const name = fileData[0];
        const mtime = fileData[1];
        const existingFile = data.files[name];
        if (existingFile && existingFile.mtime === mtime) {
          //console.log('exists', name);
          files[name] = existingFile;
        } else {
          //console.log('add', name);
          files[name] = {
            mtime,
            visited: false,
          };
        }
      });
      data.files = files;
      resolve(data);
    };

    if (os.platform() == 'win32') {
      find(roots, extensions, ignorePattern, callback);
    } else {
      findNative(roots, extensions, ignorePattern, callback);
    }
  });
};
