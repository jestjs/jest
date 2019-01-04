// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

import {readConfig} from '../index';

test('readConfig() throws when an object is passed without a file path', () => {
  expect(() => {
    readConfig(
      null /* argv */,
      {} /* packageRootOrConfig */,
      false /* skipArgvConfigOption */,
      null /* parentConfigPath */,
    );
  }).toThrowError(
    'Jest: Cannot use configuration as an object without a file path',
  );
});
