/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from '@jest/globals';

describe('DOM (real browser)', () => {
  it('creates and appends elements', () => {
    const el = document.createElement('div');
    el.textContent = 'Real Browser';
    document.body.append(el);

    expect(document.body.textContent).toContain('Real Browser');
  });

  it('handles events correctly', () => {
    const button = document.createElement('button');
    button.disabled = true;
    let clicked = false;
    button.addEventListener('click', () => {
      clicked = true;
    });
    document.body.append(button);

    button.click();
    // Real browser: disabled buttons don't fire click handlers
    expect(clicked).toBe(false);
  });

  it('has real CSS support', () => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    document.body.append(div);

    const computed = getComputedStyle(div);
    expect(computed.display).toBe('flex');
  });

  it('supports real fetch API', async () => {
    // fetch exists in real browser
    expect(typeof fetch).toBe('function');
  });
});
