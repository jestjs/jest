/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('jsdom custom html', () => {
  /* eslint-disable-next-line no-undef */
  expect(document.getElementById('root')).toBeTruthy();
});
