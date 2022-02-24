/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

describe.each(['modern', 'legacy'])(
  '%s implementation of fake timers',
  implementation => {
    it('should be possible to use from config', () => {
      const result = runJest(`fake-time/${implementation}/from-config`);
      expect(result.exitCode).toBe(0);
    });

    it('should be possible to use from jest-object', () => {
      const result = runJest(`fake-time/${implementation}/from-jest-object`);
      expect(result.exitCode).toBe(0);
    });
  },
);
