// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

import {readConfigs} from '../index';

test('readConfigs() throws when called without project paths', () => {
  expect(() => {
    readConfigs(null /* argv */, [] /* projectPaths */);
  }).toThrowError('jest: No configuration found for any project.');
});
