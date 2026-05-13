/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from '@jest/globals';

describe('cross-browser', () => {
  it('basic math works', () => {
    expect(2 + 2).toBe(4);
  });

  it('DOM works', () => {
    const el = document.createElement('p');
    el.textContent = 'cross-browser';
    document.body.append(el);
    expect(document.body.textContent).toContain('cross-browser');
  });
});
