/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import {fileURLToPath} from 'url';
import fs from 'graceful-fs';
import rimraf from 'rimraf';
import config from '../jest.config.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const configFile = path.resolve(dirname, '../jest.config.mjs');

delete config.projects;

fs.writeFileSync(
  configFile,
  `export default ${JSON.stringify(config, null, 2)};\n`,
);

rimraf.sync(path.resolve(dirname, '../examples/'));
