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

describe('moduleMocker', function() {
  var moduleMocker;

  beforeEach(function() {
    moduleMocker = require('../moduleMocker');
  });

  describe('getMetadata', function() {
    it('returns the function `name` property', function() {
      function x() {}
      var metadata = moduleMocker.getMetadata(x);
      expect(x.name).toBe('x');
      expect(metadata.name).toBe('x');
    });
  });

  describe('generateFromMetadata', function() {
    it('forwards the function name property', function() {
      function foo() {}
      var fooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(foo)
      );
      expect(fooMock.name).toBe('foo');
    });

    it('wont interfere with previous mocks on a shared prototype', function() {
      var ClassFoo = function() {};
      ClassFoo.prototype.x = function() {};
      var ClassFooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(ClassFoo)
      );
      var foo = new ClassFooMock();
      var bar = new ClassFooMock();

      foo.x.mockImplementation(function() {
        return 'Foo';
      });
      bar.x.mockImplementation(function() {
        return 'Bar';
      });

      expect(foo.x()).toBe('Foo');
      expect(bar.x()).toBe('Bar');
    });

    it('does not mock non-enumerable getters', function() {
      var foo = Object.defineProperties({}, {
        nonEnumMethod: {
          value: function() {},
        },
        nonEnumGetter: {
          get: function() { throw new Error(); },
        },
      });
      var fooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(foo)
      );

      expect(typeof foo.nonEnumMethod).toBe('function');

      expect(fooMock.nonEnumMethod.mock).not.toBeUndefined();
      expect(fooMock.nonEnumGetter).toBeUndefined();
    });

    it('mocks ES2015 non-enumerable methods', function() {
      class ClassFoo {
        foo() {}
        toString() {
          return 'Foo';
        }
      }

      var ClassFooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(ClassFoo)
      );
      var foo = new ClassFooMock();

      var instanceFoo = new ClassFoo();
      var instanceFooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(instanceFoo)
      );

      expect(typeof foo.foo).toBe('function');
      expect(typeof instanceFooMock.foo).toBe('function');
      expect(instanceFooMock.foo.mock).not.toBeUndefined();

      expect(instanceFooMock.toString.mock).not.toBeUndefined();
    });
  });
});
