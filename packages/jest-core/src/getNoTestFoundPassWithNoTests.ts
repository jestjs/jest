// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

import chalk from 'chalk';

export default function getNoTestFoundPassWithNoTests() {
  return chalk.bold('No tests found, exiting with code 0');
}
