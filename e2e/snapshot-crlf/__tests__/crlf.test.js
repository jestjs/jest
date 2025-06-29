/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
test('CR\r', () => {
  expect(1).toMatchSnapshot();
});

test('CRLF\r\n', () => {
  expect(2).toMatchSnapshot();
});

test('LF\n', () => {
  expect(3).toMatchSnapshot();
});
