/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import tempy from 'tempy';
import {onNodeVersions} from '@jest/test-utils';
import runJest from '../runJest';

onNodeVersions('>=25', () => {
  it('localStorage CRUD works inside a Jest test', async () => {
    await tempy.file.task(storageFile => {
      const result = runJest('local-storage', [], {
        nodeOptions: `--localstorage-file=${storageFile}`,
      });
      expect(result.exitCode).toBe(0);
      expect(result.stderr).not.toContain('--localstorage-file');
    });
  });
});
