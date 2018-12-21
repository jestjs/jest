// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

'use strict';

it('skips a test inside a promise', () =>
  new Promise(() => {
    pending('skipped a test inside a promise');
  }));
