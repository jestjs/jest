/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {spawn} = require('child_process');

test('something', () => {
  const subprocess = spawn(
    process.argv[0],
    [require.resolve('../interval-code')],
    {
      detached: true,
      stdio: 'ignore',
    },
  );
  subprocess.unref();
  expect(true).toBe(true);
});
