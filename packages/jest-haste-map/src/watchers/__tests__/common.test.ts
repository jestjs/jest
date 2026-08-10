/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'node:os';

jest.mock('node:os', () => ({
  ...jest.requireActual<typeof import('node:os')>('node:os'),
  platform: jest.fn(),
}));

const mockPlatform = jest.mocked(os.platform);

function loadIsIgnorableFileError(platform: NodeJS.Platform) {
  mockPlatform.mockReturnValue(platform);
  let isIgnorableFileError!: (error: NodeJS.ErrnoException) => boolean;
  jest.isolateModules(() => {
    ({isIgnorableFileError} = require('../common'));
  });
  return isIgnorableFileError;
}

function errorWithCode(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(code), {code});
}

describe('isIgnorableFileError', () => {
  it.each(['win32', 'darwin', 'linux'] as const)(
    'ignores a file that vanished on %s',
    platform => {
      expect(loadIsIgnorableFileError(platform)(errorWithCode('ENOENT'))).toBe(
        true,
      );
    },
  );

  it('ignores EPERM on win32, where an outside process can hold a file open', () => {
    expect(loadIsIgnorableFileError('win32')(errorWithCode('EPERM'))).toBe(
      true,
    );
  });

  it.each(['darwin', 'linux'] as const)(
    'does not ignore EPERM on %s',
    platform => {
      expect(loadIsIgnorableFileError(platform)(errorWithCode('EPERM'))).toBe(
        false,
      );
    },
  );

  it.each(['win32', 'darwin', 'linux'] as const)(
    'does not ignore EACCES on %s',
    platform => {
      expect(loadIsIgnorableFileError(platform)(errorWithCode('EACCES'))).toBe(
        false,
      );
    },
  );
});
