/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const SnapshotFile = require('./SnapshotFile');

const fs = require('fs');
const path = require('path');

const EXTENSION = SnapshotFile.SNAPSHOT_EXTENSION;
const patchAttr = (attr, state) => {
  attr.onStart = function(onStart) {
    return function(context) {
      const specRunning = context.getFullName();
      let index = 0;
      state.getCounter = () => index;
      state.incrementCounter = () => index++;
      state.currentSpecName = specRunning;
      if (onStart) {
        onStart(context);
      }
    };
  }(attr.onStart);
};

const patchJasmine = (jasmine, state) => {
  jasmine.Spec = (realSpec => {
    const Spec = function Spec(attr) {
      patchAttr(attr, state);
      realSpec.call(this, attr);
    };
    Spec.prototype = realSpec.prototype;
    for (const statics in realSpec) {
      if (Object.prototype.hasOwnProperty.call(realSpec, statics)) {
        Spec[statics] = realSpec[statics];
      }
    }
    return Spec;
  })(jasmine.Spec);
};

const fileExists = filePath => {
  try {
    return fs.statSync(filePath).isFile();
  } catch (e) {}
  return false;
};

module.exports = {
  EXTENSION,
  cleanup(hasteMap, update) {
    const extension = new RegExp('\\.' + EXTENSION);
    return hasteMap.instance.matchFiles(extension).then(files => {
      const filesRemoved = files
        .filter(snapshotFile => !fileExists(path.resolve(
          path.dirname(snapshotFile),
          '..',
          path.basename(snapshotFile, '.' + EXTENSION)
        )))
        .map(snapshotFile => update && fs.unlinkSync(snapshotFile))
        .length;

      return {
        filesRemoved,
      };
    });
  },
  getMatchers: require('./getMatchers'),
  getSnapshotState: (jasmine, filePath) => {
    const state = Object.create(null);
    state.currentSpecName = null;
    state.getCounter = null;
    state.incrementCounter = null;
    state.snapshot = SnapshotFile.forFile(filePath);
    state.added = 0;
    state.updated = 0;
    state.matched = 0;
    state.unmatched = 0;

    patchJasmine(jasmine, state);
    return state;
  },
};
