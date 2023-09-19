/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment jsdom
 */

/// <reference lib="dom" />

/* eslint-env browser*/

function exampleDispatch() {
  window.dispatchEvent(new CustomEvent('event', {}));
}

describe('spy on `dispatchEvent`', () => {
  const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

  it('should be called', () => {
    exampleDispatch();

    expect(dispatchEventSpy).toHaveBeenCalled();
  });
});
