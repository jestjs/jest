/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'node:os';
import * as path from 'node:path';
/* eslint-disable import-x/default */
import fs from 'graceful-fs';
/* eslint-enable import-x/default */

const DIR = path.join(os.tmpdir(), 'jest-global-teardown-esm-typescript');

export default function (): void {
  fs.mkdirSync(DIR, {recursive: true});
  fs.writeFileSync(path.join(DIR, 'teardown.txt'), import.meta.url);
}
