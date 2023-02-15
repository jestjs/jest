/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import clearLine from './clearLine';
import isInteractive from './isInteractive';

export function print(stream: NodeJS.WriteStream): void {
  if (isInteractive) {
    stream.write(chalk.bold.dim('Determining test suites to run...'));
  }
}

export function remove(stream: NodeJS.WriteStream): void {
  if (isInteractive) {
    clearLine(stream);
  }
}
