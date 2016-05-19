/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const path = require('path');
const TestSnapshot = require('./TestSnapshot');

const SNAPSHOT_EXTENSION = '.snap';
const patchAttr = (attr, state) => {
  attr.onStart = function(onStart) {
    return function(context) {
      const specRunning = context.getFullName();
      let index = 0;
      Object.defineProperty(state.specsNextCallCounter, specRunning, {
        get() {return index++},
        enumerable: true
      });
      state.specRunningFullName = specRunning;
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
      if (realSpec.hasOwnProperty(statics)) {
        Spec[statics] = realSpec[statics];
      }
    }
    return Spec;
  })(jasmine.Spec);
};

module.exports = {
  getMatchers: require('./getMatchers'),
  getSnapshotState: (jasmine, filePath) => {
    const state = Object.create(null);
    state.specsNextCallCounter = Object.create(null);
    patchJasmine(jasmine, state);

    const snapshotsPath = path.join(path.dirname(filePath), '__snapshots__');

    const snapshotFilename = path.join(
      snapshotsPath,
      path.basename(filePath) + SNAPSHOT_EXTENSION
    );

    state.snapshot = new TestSnapshot(snapshotFilename);
    return state;
  },
};
