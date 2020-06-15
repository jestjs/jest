/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {cpus} from 'os';
import type {Config} from '@jest/types';

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
    const numCpus = cpus() ? cpus().length : 1;
    const isWatchModeEnabled = argv.watch || argv.watchAll;
    return Math.max(
      isWatchModeEnabled ? Math.floor(numCpus / 2) : numCpus - 1,
      1,
    );
  }
}

const parseWorkers = (maxWorkers: string | number): number => {
  const parsed = parseInt(maxWorkers.toString(), 10);

  if (
    typeof maxWorkers === 'string' &&
    maxWorkers.trim().endsWith('%') &&
    parsed > 0 &&
    parsed <= 100
  ) {
    const numCpus = cpus().length;
    const workers = Math.floor((parsed / 100) * numCpus);
    return workers >= 1 ? workers : 1;
  }

  return parsed > 0 ? parsed : 1;
};
