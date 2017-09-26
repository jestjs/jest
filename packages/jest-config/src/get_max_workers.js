/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Argv} from 'types/Argv';

import os from 'os';

export default function getMaxWorkers(argv: Argv): number {
  if (argv.runInBand) {
    return 1;
  } else if (argv.maxWorkers) {
    return parseInt(argv.maxWorkers, 10);
  } else {
    const cpus = os.cpus().length;
    return Math.max(argv.watch ? Math.floor(cpus / 2) : cpus - 1, 1);
  }
}
