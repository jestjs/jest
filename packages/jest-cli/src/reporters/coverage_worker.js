/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {GlobalConfig, ProjectConfig, Path} from 'types/Config';
import type {SerializableError} from 'types/TestResult';

import fs from 'fs';
import generateEmptyCoverage from '../generate_empty_coverage';

type CoverageWorkerData = {|
  globalConfig: GlobalConfig,
  config: ProjectConfig,
  path: Path,
|};

type WorkerCallback = (error: ?SerializableError, result: ?Object) => void;

function formatCoverageError(error, filename: Path): SerializableError {
  const message = `
    Failed to collect coverage from ${filename}
    ERROR: ${error}
    STACK: ${error.stack}
  `;

  return {
    code: error.code || undefined,
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

// Cannot use ESM export as worker-farm chokes
module.exports = (
  {config, globalConfig, path}: CoverageWorkerData,
  callback: WorkerCallback,
) => {
  try {
    const source = fs.readFileSync(path, 'utf8');
    const result = generateEmptyCoverage(source, path, globalConfig, config);
    callback(null, result);
  } catch (error) {
    callback(formatCoverageError(error, path), undefined);
  }
};
