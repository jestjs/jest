/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as process from 'process';

const oldIsTTY = process.stdout.isTTY;
const oldTERM = process.env.TERM;

afterEach(() => {
  process.stdout.isTTY = oldIsTTY;
  process.env.TERM = oldTERM;
  jest.resetModules();
});

it('Returns true when running in an interactive environment', () => {
  jest.doMock('ci-info', () => ({isCI: false}));
  process.stdout.isTTY = true;
  process.env.TERM = 'xterm-256color';

  const isInteractive = (
    require('../isInteractive') as typeof import('../isInteractive')
  ).default;

  expect(isInteractive).toBe(true);
});

it.each([
  {isCI: false, isTTY: false, term: 'xterm-256color'},
  {isCI: false, isTTY: false, term: 'xterm-256color'},
  {isCI: true, isTTY: true, term: 'xterm-256color'},
  {isCI: false, isTTY: false, term: 'dumb'},
])(
  'Returns false when running in a non-interactive environment',
  ({isCI, isTTY, term}) => {
    jest.doMock('ci-info', () => ({isCI}));
    process.stdout.isTTY = isTTY;
    process.env.TERM = term;

    const isInteractive = (
      require('../isInteractive') as typeof import('../isInteractive')
    ).default;

    expect(isInteractive).toBe(false);
  },
);
