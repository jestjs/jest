/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

describe('failing tests', () => {
  it('fails', () => {
    throw new Error(`failing test`);
  });

  it('fails 2', () => {
    throw new Error(`failing test`);
  });

  it('passes', () => {});

  it('fails 3', () => {
    throw new Error(`failing test`);
  });

  it('passes 2', () => {});
});
