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

import type {Config, Path} from 'types/Config';

const IstanbulInstrument = require('istanbul-lib-instrument');

const {transformSource, shouldInstrument} = require('jest-runtime');

module.exports = function(source: string, filename: Path, config: Config) {
  if (shouldInstrument(filename, config)) {
    // Transform file without instrumentation first, to make sure produced
    // source code is ES6 (no flowtypes etc.) and can be instrumented
    const transformResult = transformSource(filename, config, source, false);
    const instrumenter = IstanbulInstrument.createInstrumenter();
    instrumenter.instrumentSync(transformResult.code, filename);
    return {
      coverage: instrumenter.fileCoverage,
      sourceMapPath: transformResult.sourceMapPath,
    };
  } else {
    return null;
  }
};
