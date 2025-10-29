/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {tmpdir} from 'os';
import {useSpecificPackageManager} from '../utils';
import path from 'path';
import {cleanup, writeFiles} from '../../../../e2e/Utils';

const DIR = path.resolve(tmpdir(), 'jest_config_utils_test');
const env = {...process.env};

beforeEach(() => {
  cleanup(DIR);
});

afterEach(() => {
  process.env = env;
  cleanup(DIR);
});

describe('useSpecificPackageManager', () => {
  it('returns true when package manager matches with arg is used', () => {
    writeFiles(DIR, {
      'pnpm-lock.yaml': "lockfileVersion: '9.0'",
    });
    process.env.npm_config_user_agent = 'pnpm';
    expect(useSpecificPackageManager('pnpm', DIR)).toBe(true);
  });

  it('returns true when package manager is not used but signature lockfile can be found', () => {
    writeFiles(DIR, {
      'pnpm-lock.yaml': "lockfileVersion: '9.0'",
    });
    process.env.npm_config_user_agent = 'node';
    expect(useSpecificPackageManager('pnpm', DIR)).toBe(true);
  });

  it('returns false when package manager different from arg is used', () => {
    process.env.npm_config_user_agent = 'something_else';
    expect(useSpecificPackageManager('npm', DIR)).toBe(false);
  });
});
