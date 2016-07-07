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

import type {Path} from 'types/Config';

const istanbul = require('istanbul');

class IstanbulCollector {

  _coverageDataStore: Object;

  constructor() {
    this._coverageDataStore = Object.create(null);
  }

  getCoverageDataStore() {
    return this._coverageDataStore;
  }

  getInstrumentedSource(
    sourceText: string,
    filename: Path,
    storageVarName: string,
  ) {
    const instrumentor = new istanbul.Instrumenter();
    const source = instrumentor.instrumentSync(sourceText, filename);
    const tracker = instrumentor.currentState.trackerVar;
    return source + storageVarName + '.coverState=' + tracker + ';';
  }

  extractRuntimeCoverageInfo() {
    return this._coverageDataStore.coverState;
  }

}

module.exports = IstanbulCollector;
