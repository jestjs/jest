/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {HasteContext} from 'types/HasteMap';
import type {Jasmine} from 'types/Jasmine';
import type {Path} from 'types/Config';
import type {SnapshotState} from './SnapshotState';

const SnapshotFile = require('./SnapshotFile');

const fileExists = require('jest-file-exists');
const fs = require('fs');
const matcher = require('./matcher');
const path = require('path');

const EXTENSION = SnapshotFile.SNAPSHOT_EXTENSION;

const patchAttr = (attr, state) => {
  attr.onStart = function(onStart) {
    return function(context) {
      state.setSpecName(context.getFullName());
      state.setCounter(0);
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

module.exports = {
  EXTENSION,
  cleanup(hasteContext: HasteContext, update: boolean) {
    const pattern = '\\.' + EXTENSION + '$';
    return hasteContext.instance.matchFiles(pattern).then(files => {
      const filesRemoved = files
        .filter(snapshotFile => !fileExists(
          path.resolve(
            path.dirname(snapshotFile),
            '..',
            path.basename(snapshotFile, '.' + EXTENSION),
          ),
          hasteContext.moduleMap.files,
        ))
        .map(snapshotFile => {
          if (update) {
            fs.unlinkSync(snapshotFile);
          }
        })
        .length;

      return {
        filesRemoved,
      };
    });
  },
  matcher,
  getSnapshotState: (jasmine: Jasmine, filePath: Path): SnapshotState => {
    let _index = 0;
    let _name = '';
    /* $FlowFixMe */
    const state = Object.assign(Object.create(null), {
      getCounter: () => _index,
      getSpecName: () => _name,
      incrementCounter: () => ++_index,
      setCounter(index) {
        _index = index;
      },
      setSpecName(name) {
        _name = name;
      },
      snapshot: SnapshotFile.forFile(filePath),
      added: 0,
      updated: 0,
      matched: 0,
      unmatched: 0,
    });

    patchJasmine(jasmine, state);
    return state;
  },
};
