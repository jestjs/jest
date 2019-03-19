/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import os from 'os';
import {Config} from '@jest/types';

export default function getMaxWorkers(
  argv: Partial<Pick<Config.Argv, 'maxWorkers' | 'runInBand' | 'watch'>>,
): number {
  if (argv.runInBand) {
    return 1;
  } else if (argv.maxWorkers) {
    // TODO: How to type this properly? Should probably use `coerce` from `yargs`
    const maxWorkers = (argv.maxWorkers as unknown) as number | string;
    const parsed = parseInt(maxWorkers as string, 10);

    if (
      typeof maxWorkers === 'string' &&
      maxWorkers.trim().endsWith('%') &&
      parsed > 0 &&
      parsed <= 100
    ) {
      const cpus = os.cpus().length;
      const workers = Math.floor((parsed / 100) * cpus);
      return workers >= 1 ? workers : 1;
    }

    return parsed > 0 ? parsed : 1;
  } else {
    const cpus = os.cpus() ? os.cpus().length : 1;
    return Math.max(argv.watch ? Math.floor(cpus / 2) : cpus - 1, 1);
  }
}
