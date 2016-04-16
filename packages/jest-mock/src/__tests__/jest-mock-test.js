/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.disableAutomock();

describe('moduleMocker', () => {
  let moduleMocker;

  beforeEach(() => {
    moduleMocker = require('../');
  });

  describe('getMetadata', () => {
    it('returns the function `name` property', () => {
      function x() {}
      const metadata = moduleMocker.getMetadata(x);
      expect(x.name).toBe('x');
      expect(metadata.name).toBe('x');
    });

    it('mocks constant values', () => {
      expect(moduleMocker.getMetadata('banana').value).toEqual('banana');
      expect(moduleMocker.getMetadata(27).value).toEqual(27);
      expect(moduleMocker.getMetadata(false).value).toEqual(false);
    });
  });

  describe('generateFromMetadata', () => {
    it('forwards the function name property', () => {
      function foo() {}
      const fooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(foo)
      );
      expect(fooMock.name).toBe('foo');
    });

    it('wont interfere with previous mocks on a shared prototype', () => {
      const ClassFoo = function() {};
      ClassFoo.prototype.x = () => {};
      const ClassFooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(ClassFoo)
      );
      const foo = new ClassFooMock();
      const bar = new ClassFooMock();

      foo.x.mockImplementation(() => {
        return 'Foo';
      });
      bar.x.mockImplementation(() => {
        return 'Bar';
      });

      expect(foo.x()).toBe('Foo');
      expect(bar.x()).toBe('Bar');
    });

    it('does not mock non-enumerable getters', () => {
      const foo = Object.defineProperties({}, {
        nonEnumMethod: {
          value: () => {},
        },
        nonEnumGetter: {
          get: () => { throw new Error(); },
        },
      });
      const fooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(foo)
      );

      expect(typeof foo.nonEnumMethod).toBe('function');

      expect(fooMock.nonEnumMethod.mock).not.toBeUndefined();
      expect(fooMock.nonEnumGetter).toBeUndefined();
    });

    it('mocks ES2015 non-enumerable methods', () => {
      class ClassFoo {
        foo() {}
        toString() {
          return 'Foo';
        }
      }

      const ClassFooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(ClassFoo)
      );
      const foo = new ClassFooMock();

      const instanceFoo = new ClassFoo();
      const instanceFooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(instanceFoo)
      );

      expect(typeof foo.foo).toBe('function');
      expect(typeof instanceFooMock.foo).toBe('function');
      expect(instanceFooMock.foo.mock).not.toBeUndefined();

      expect(instanceFooMock.toString.mock).not.toBeUndefined();
    });

    it('mocks methods that are bound multiple times', () => {
      const func = function func() {};
      const multipleBoundFunc = func.bind(null).bind(null);

      const multipleBoundFuncMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(multipleBoundFunc)
      );

      expect(typeof multipleBoundFuncMock).toBe('function');
    });

    it('mocks regexp instances', () => {
      expect(
        () => moduleMocker.generateFromMetadata(moduleMocker.getMetadata(/a/))
      ).not.toThrow();
    });
  });

  describe('mockImplementationOnce', () => {
    it('should mock single call to a mock function', () => {
      const mockFn = moduleMocker.getMockFunction();

      mockFn.mockImplementationOnce(() => {
        return 'Foo';
      }).mockImplementationOnce(() => {
        return 'Bar';
      });

      expect(mockFn()).toBe('Foo');
      expect(mockFn()).toBe('Bar');
      expect(mockFn()).toBeUndefined();
    });

    it('should fallback to default mock function when no specific mock is available', () => {
      const mockFn = moduleMocker.getMockFunction();

      mockFn.mockImplementationOnce(() => {
        return 'Foo';
      }).mockImplementationOnce(() => {
        return 'Bar';
      }).mockImplementation(() => {
        return 'Default';
      });

      expect(mockFn()).toBe('Foo');
      expect(mockFn()).toBe('Bar');
      expect(mockFn()).toBe('Default');
      expect(mockFn()).toBe('Default');
    });
  });
});
