/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import yargs from 'yargs';
import {readFileSync} from 'fs';

// eslint-disable-next-line import/default
import jestDiff from '../';
import {NO_DIFF_MESSAGE} from '../constants';

/* eslint-disable sort-keys */
const EXIT_CODES = {
  // like GNU diff
  EQUAL: 0,
  DIFFERENT: 1,
  INVALID_USAGE: 2,

  // more specific than GNU diff, which exits with 2 in all error cases
  INTERNAL_ERROR: 10,
  IO_ERROR: 20,
  INVALID_JSON: 30,
};
/* eslint-enable sort-keys */

/* eslint-disable-next-line consistent-return */
const read = (path: string) => {
  try {
    const data = readFileSync(path);
    try {
      return JSON.parse(String(data));
    } catch (parseErr) {
      console.error(`Failed to parse file ${path} as JSON`, parseErr);
      process.exit(EXIT_CODES.INVALID_JSON);
    }
  } catch (readErr) {
    console.error(`Failed to read file ${path}`, readErr);
    process.exit(EXIT_CODES.IO_ERROR);
  }
};

export default async () => {
  const parser = yargs(process.argv.slice(2))
    .demandCommand(2, 2) // positional

    .version()
    .alias('v', 'version')

    .usage('$0 a.json b.json')
    .help()
    .alias('h', 'help')

    .fail((msg, err, yargs) => {
      if (err) throw err;
      console.error(yargs.help());
      console.error(msg);
      process.exit(EXIT_CODES.INVALID_USAGE);
    });

  const [aPath, bPath] = parser.argv._;
  const a = read(aPath);
  const b = read(bPath);

  const diffMsg = jestDiff(a, b);
  if (diffMsg == null) {
    console.error('diff unexpectedly returned null');
    process.exit(EXIT_CODES.INTERNAL_ERROR);
  } else if (diffMsg === NO_DIFF_MESSAGE) {
    process.exit(EXIT_CODES.EQUAL);
  } else {
    process.stdout.write(diffMsg);
    process.exit(EXIT_CODES.DIFFERENT);
  }
};
