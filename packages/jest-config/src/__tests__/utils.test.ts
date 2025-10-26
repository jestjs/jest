/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useSpecificPackageManager} from '../utils';

const env = {...process.env};

afterEach(() => {
  process.env = env;
});

describe('useSpecificPackageManager', () => {
  it('returns true when package manager matches with arg is used', () => {
    process.env.npm_config_user_agent = 'pnpm';
    expect(useSpecificPackageManager('pnpm')).toBe(true);
  });
  it('returns false when package manager different from arg is used', () => {
    process.env.npm_config_user_agent = 'something_else';
    expect(useSpecificPackageManager('pnpm')).toBe(false);
  });
});
