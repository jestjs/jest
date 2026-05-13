/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* global document */

// Runs in jsdom (Node)
describe('math (jsdom)', () => {
  it('adds numbers', () => {
    expect(1 + 1).toBe(2);
  });

  it('multiplies numbers', () => {
    expect(3 * 4).toBe(12);
  });

  it('has access to jsdom document', () => {
    const div = document.createElement('div');
    div.textContent = 'jsdom';
    expect(div.textContent).toBe('jsdom');
  });
});
