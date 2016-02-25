/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.autoMockOff();

describe('HasteModuleLoader', () => {
  const stubPath = './some/path/to/module';

  describe('setMock for nonexistent (virtual) module', () => {
    it('should throw if there\'s no stub', () => {
      expect(() => require(stubPath)).toThrow();
    });

    it('should throw when call setMock on a non-existent ' +
      'module with no "virtual" option specified', () => {
      expect(() => jest.setMock(stubPath, {stub: true})).toThrow();
    });

    it('should set a mock for a virtual module', () => {
      jest.setMock(stubPath, {stub: true}, {virtual: true});
      expect(require(stubPath).stub).toBe(true);
    });
  });
});
