/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createRequire} from 'module';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';
import fs from 'graceful-fs';
import rimraf from 'rimraf';
const require = createRequire(import.meta.url);

const configFile = require.resolve('../jest.config');

const config = require(configFile);

delete config.projects;

fs.writeFileSync(configFile, `module.exports = ${JSON.stringify(config)};\n`);

rimraf.sync(resolve(dirname(fileURLToPath(import.meta.url)), '../examples/'));
