/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {json as runWithJson} from '../runJest';

test('reads config from cjs file', () => {
  const {json, exitCode} = runWithJson('cjs-config', ['--show-config'], {
    skipPkgJsonCheck: true,
  });

  expect(exitCode).toBe(0);
  expect(json.configs).toHaveLength(1);
  expect(json.configs[0].displayName).toEqual({
    color: 'white',
    name: 'Config from cjs file',
  });
});
