/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment jsdom
 */

/// <reference lib="dom" />

/* eslint-env browser */

import {isError} from '../utils';

// Copied from https://github.com/graingert/angular.js/blob/a43574052e9775cbc1d7dd8a086752c979b0f020/test/AngularSpec.js#L1883
describe('isError', () => {
  function testErrorFromDifferentContext(
    createError: (win: Window | typeof globalThis) => Error | null,
  ) {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    try {
      const contentWindow = iframe.contentWindow;

      expect(contentWindow).toBeTruthy();

      if (!contentWindow) {
        throw new Error('Dead code');
      }

      const error = createError(contentWindow);
      expect(isError(error)).toBe(true);
    } finally {
      iframe.parentElement!.removeChild(iframe);
    }
  }

  it('should not assume objects are errors', () => {
    const fakeError = {message: 'A fake error', stack: 'no stack here'};
    expect(isError(fakeError)).toBe(false);
  });

  it('should detect simple error instances', () => {
    expect(isError(new Error())).toBe(true);
  });

  it('should detect errors from another context', () => {
    testErrorFromDifferentContext(
      win => new (win as typeof globalThis).Error(),
    );
  });

  it('should detect DOMException errors from another context', () => {
    testErrorFromDifferentContext(win => {
      try {
        win.document.querySelectorAll('');
      } catch (e) {
        return e as Error;
      }

      return null;
    });
  });
});
