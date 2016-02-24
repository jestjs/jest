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

  describe('setStub', () => {
    it('should throw if there\'s no stub', () => {
      expect(() => require(stubPath)).toThrow();
    });

    it('should set a stub', () => {
      jest.setStub(stubPath, {stub: true});
      expect(require(stubPath).stub).toBe(true);
    });
  });
});
