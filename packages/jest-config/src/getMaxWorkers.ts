/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  // @ts-expect-error - added in Node 19.4.0
  availableParallelism,
  cpus,
} from 'os';
import type {Config} from '@jest/types';

function getNumCpus(): number {
  return typeof availableParallelism === 'function'
    ? availableParallelism()
    : cpus()?.length ?? 1;
}

export default function getMaxWorkers(
  argv: Partial<
    Pick<Config.Argv, 'maxWorkers' | 'runInBand' | 'watch' | 'watchAll'>
  >,
  defaultOptions?: Partial<Pick<Config.Argv, 'maxWorkers'>>,
): number {
  if (argv.runInBand) {
    return 1;
  } else if (argv.maxWorkers) {
    return parseWorkers(argv.maxWorkers);
  } else if (defaultOptions && defaultOptions.maxWorkers) {
    return parseWorkers(defaultOptions.maxWorkers);
  } else {
    // In watch mode, Jest should be unobtrusive and not use all available CPUs.
    const numCpus = getNumCpus();
    const isWatchModeEnabled = argv.watch || argv.watchAll;
    return Math.max(
      isWatchModeEnabled ? Math.floor(numCpus / 2) : numCpus - 1,
      1,
    );
  }
}

const parseWorkers = (maxWorkers: string | number): number => {
  const parsed = Number.parseInt(maxWorkers.toString(), 10);

  if (
    typeof maxWorkers === 'string' &&
    maxWorkers.trim().endsWith('%') &&
    parsed > 0 &&
    parsed <= 100
  ) {
    const numCpus = getNumCpus();
    const workers = Math.floor((parsed / 100) * numCpus);
    return Math.max(workers, 1);
  }

  return parsed > 0 ? parsed : 1;
};
