/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import isBuiltinModule from '../isBuiltinModule';

describe('isBuiltinModule', () => {
  it('should return true for the `path` module', () => {
    expect(isBuiltinModule('path')).toBe(true);
  });

  it('should return false for the `chalk` module', () => {
    expect(isBuiltinModule('chalk')).toBe(false);
  });

  it('should return true for the `_http_common` module', () => {
    expect(isBuiltinModule('_http_common')).toBe(true);
  });

  it('should return false for any internal node builtins', () => {
    expect(isBuiltinModule('internal/http')).toBe(false);
  });
});
