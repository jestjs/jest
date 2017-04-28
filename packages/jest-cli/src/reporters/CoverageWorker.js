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

import type {GlobalConfig, ProjectConfig, Path} from 'types/Config';
import type {SerializableError} from 'types/TestResult';

const fs = require('fs');
const generateEmptyCoverage = require('../generateEmptyCoverage');

type CoverageWorkerData = {|
  globalConfig: GlobalConfig,
  config: ProjectConfig,
  untestedFilePath: Path,
|};

type WorkerCallback = (error: ?SerializableError, result: ?Object) => void;

function formatCoverageError(error, filename: Path): SerializableError {
  const message = `
    Failed to collect coverage from ${filename}
    ERROR: ${error}
    STACK: ${error.stack}
  `;

  return {
    message,
    stack: error.stack,
    type: 'ERROR',
  };
}

// Make sure uncaught errors are logged before we exit.
process.on('uncaughtException', err => {
  console.error(err.stack);
  process.exit(1);
});

module.exports = (
  {globalConfig, config, untestedFilePath}: CoverageWorkerData,
  callback: WorkerCallback,
) => {
  try {
    const source = fs.readFileSync(untestedFilePath).toString();
    const result = generateEmptyCoverage(
      source,
      untestedFilePath,
      globalConfig,
      config,
    );
    callback(null, result);
  } catch (e) {
    callback(formatCoverageError(e, untestedFilePath), undefined);
  }
};
