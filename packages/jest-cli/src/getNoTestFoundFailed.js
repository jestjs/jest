// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

import chalk from 'chalk';

export default function getNoTestFoundFailed() {
  return (
    chalk.bold('No failed test found.\n') +
    chalk.dim('Press `f` to quit "only failed tests" mode.')
  );
}
