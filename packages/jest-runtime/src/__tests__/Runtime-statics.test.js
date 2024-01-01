/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {makeProjectConfig} from '@jest/test-utils';
import HasteMap from 'jest-haste-map';
import Runtime from '../';

jest.mock('jest-haste-map');

describe('Runtime statics', () => {
  const projectConfig = makeProjectConfig({
    cacheDirectory: '/tmp',
    haste: {},
    modulePathIgnorePatterns: ['/root/ignore-1', '/root/ignore-2'],
    watchPathIgnorePatterns: ['/watch-root/ignore-1'],
  });
  const options = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Runtime.createHasteMap passes correct ignore files to HasteMap', async () => {
    await Runtime.createHasteMap(projectConfig, options);
    expect(HasteMap.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ignorePattern: /\/root\/ignore-1|\/root\/ignore-2/,
      }),
    );
  });

  test('Runtime.createHasteMap passes correct ignore files to HasteMap in watch mode', async () => {
    await Runtime.createHasteMap(projectConfig, {...options, watch: true});
    expect(HasteMap.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ignorePattern:
          /\/root\/ignore-1|\/root\/ignore-2|\/watch-root\/ignore-1/,
        watch: true,
      }),
    );
  });
});
