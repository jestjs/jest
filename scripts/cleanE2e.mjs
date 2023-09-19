/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {dirname, normalize, resolve} from 'path';
import {fileURLToPath} from 'url';
import {glob} from 'glob';
import fs from 'graceful-fs';

const excludedModules = [
  'e2e/global-setup-node-modules/node_modules/',
  'e2e/presets/cjs/node_modules/',
  'e2e/presets/js/node_modules/',
  'e2e/presets/js-type-module/node_modules/',
  'e2e/presets/json/node_modules/',
  'e2e/presets/mjs/node_modules/',
  'e2e/resolve-conditions/node_modules/',
  'e2e/retain-all-files/node_modules/',
].map(dir => normalize(dir));

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const e2eNodeModules = glob.sync('e2e/{*,*/*}/node_modules/', {
  absolute: true,
  cwd: rootDir,
  ignore: excludedModules,
});

e2eNodeModules.forEach(dir => {
  fs.rmSync(dir, {force: true, recursive: true});
});
