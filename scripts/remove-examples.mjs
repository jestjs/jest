/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {fileURLToPath} from 'url';
import fs from 'graceful-fs';
import config from '../jest.config.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const configFile = path.resolve(dirname, '../jest.config.mjs');

delete config.projects;

fs.writeFileSync(
  configFile,
  `export default ${JSON.stringify(config, null, 2)};\n`,
);

fs.rmSync(path.resolve(dirname, '../examples/'), {
  force: true,
  recursive: true,
});
