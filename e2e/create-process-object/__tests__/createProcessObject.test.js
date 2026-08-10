/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const domain = require('domain');

test('allows retrieving the current domain', () => {
  domain.create().run(() => {
    expect(process.domain).not.toBeNull();
  });
});
