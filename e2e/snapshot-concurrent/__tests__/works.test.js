/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

const sleep = ms => new Promise(r => setTimeout(r, ms));

describe('A', () => {
  it.concurrent('a', async () => {
    await sleep(100);
    expect('Aa1').toMatchSnapshot();
    expect('Aa2').toMatchSnapshot();
  });

  it.concurrent('b', async () => {
    await sleep(10);
    expect('Ab1').toMatchSnapshot();
    expect('Ab2').toMatchSnapshot();
  });

  it.concurrent('c', async () => {
    expect('Ac1').toMatchSnapshot();
    expect('Ac2').toMatchSnapshot();
  });

  it('d', () => {
    expect('Ad1').toMatchSnapshot();
    expect('Ad2').toMatchSnapshot();
  });
});

it.concurrent('B', async () => {
  await sleep(10);
  expect('B1').toMatchSnapshot();
  expect('B2').toMatchSnapshot();
});

it('C', () => {
  expect('C1').toMatchSnapshot();
  expect('C2').toMatchSnapshot();
});

it.concurrent('D', async () => {
  expect('D1').toMatchSnapshot();
  expect('D2').toMatchSnapshot();
});
