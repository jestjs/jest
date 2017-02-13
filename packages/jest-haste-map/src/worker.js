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

import type {SerializableError} from 'types/TestResult';
import type {
  WorkerMessage,
  WorkerCallback,
} from './types';

const H = require('./constants');

const docblock = require('./lib/docblock');
const extractRequires = require('./lib/extractRequires');
const fs = require('graceful-fs');
const path = require('path');

const JSON_EXTENSION = '.json';
const PACKAGE_JSON = path.sep + 'package' + JSON_EXTENSION;

const formatError = (error: string|Error): SerializableError => {
  if (typeof error === 'string') {
    return {
      message: error,
      stack: null,
      type: 'Error',
    };
  }

  return {
    message: error.message,
    stack: error.stack,
    type: 'Error',
  };
};

module.exports = (data: WorkerMessage, callback: WorkerCallback): void => {
  try {
    const filePath = data.filePath;
    const content = fs.readFileSync(filePath, 'utf8');
    let module;
    let id;
    let dependencies;

    if (filePath.endsWith(PACKAGE_JSON)) {
      const fileData = JSON.parse(content);
      if (fileData.name) {
        id = fileData.name;
        module = [filePath, H.PACKAGE];
      }
    } else if (!filePath.endsWith(JSON_EXTENSION)) {
      const doc = docblock.parse(docblock.extract(content));
      id = doc.providesModule || doc.provides;
      dependencies = extractRequires(content);
      if (id) {
        module = [filePath, H.MODULE];
      }
    }

    callback(null, {dependencies, id, module});
  } catch (error) {
    callback(formatError(error));
  }
};
