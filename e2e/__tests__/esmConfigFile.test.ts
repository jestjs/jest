/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {onNodeVersions} from '@jest/test-utils';
import {getConfig} from '../runJest';

test('reads config from cjs file', () => {
  const {configs} = getConfig('esm-config/cjs', [], {
    skipPkgJsonCheck: true,
  });

  expect(configs).toHaveLength(1);
  expect(configs[0].displayName).toEqual({
    color: 'white',
    name: 'Config from cjs file',
  });
});

// not unflagged for other versions yet. Update this range if that changes
onNodeVersions('>=13.2.0', () => {
  test('reads config from mjs file', () => {
    const {configs} = getConfig('esm-config/mjs', [], {
      skipPkgJsonCheck: true,
    });

    expect(configs).toHaveLength(1);
    expect(configs[0].displayName).toEqual({
      color: 'white',
      name: 'Config from mjs file',
    });
  });

  test('reads config from js file when package.json#type=module', () => {
    const {configs} = getConfig('esm-config/js', [], {
      skipPkgJsonCheck: true,
    });

    expect(configs).toHaveLength(1);
    expect(configs[0].displayName).toEqual({
      color: 'white',
      name: 'Config from js file',
    });
  });
});
