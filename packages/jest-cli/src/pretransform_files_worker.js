/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ProjectConfig} from 'types/Config';

import Runtime from 'jest-runtime';
import fs from 'fs';

const {ScriptTransformer} = Runtime;
const transformers = new Map();

const pretransformFilesWorker = (
  configsWithPaths: Array<[ProjectConfig, string]>,
  callback: (error?: Error) => void,
) => {
  try {
    for (const [config, filePath] of configsWithPaths) {
      if (!transformers.has(config.name)) {
        transformers.set(config.name, new ScriptTransformer(config));
      }
      const scriptTransformer = transformers.get(config.name);
      if (!scriptTransformer) {
        throw new Error('invariant: scriptTransformer must be present');
      }
      const content = fs.readFileSync(filePath, 'utf8');
      try {
        scriptTransformer.transformSource(filePath, content, false, false);
      } catch (e) {
        console.error(`failed to transform ${filePath}`);
      }
    }

    callback();
  } catch (error) {
    callback(error);
  }
};

module.exports = pretransformFilesWorker;
