/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import runJest from '../runJest';

describe('watch requires hq or git', () => {
  let stderr, status;
  beforeEach(() => {
    ({stderr, status} = runJest('watch_requires_hq_or_git', ['--watch']));
  });

  test('given a non git/hq project, when running jest with --watch, then an error is printed', () => {
    expect(stderr).toBe(
      '--watch is not supported without git/hg, please use --watchAll',
    );
  });

  test('given a non git/hq project, when running jest with --watch, then there is an error return status', () => {
    expect(status).toBe(1);
  });
});
