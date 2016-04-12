/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

describe('jasmineTestRunner', function() {
  describe('custom matchers', function() {

    it('has toBeCalled', function() {
      var mockFn = jest.genMockFunction();

      mockFn();
      expect(mockFn).toBeCalled();
    });

    it('error when parameters get passed to toBeCalled', () => {
      var mockFn = jest.genMockFunction();
      mockFn();
      let hasThrown = false;
      try {
        expect(mockFn).toBeCalled('should throw');
      } catch (e) {
        hasThrown = true;
      }
      expect(hasThrown).toBe(true);
    });

    it('has toBeCalledWith', function() {
      var mockFn = jest.genMockFunction();

      mockFn('foo', 'bar');
      expect(mockFn).toBeCalledWith('foo', 'bar');

      mockFn('baz');
      expect(mockFn).toBeCalledWith('foo', 'bar');
      expect(mockFn).toBeCalledWith('baz');
    });

    it('has lastCalledWith', function() {
      var mockFn = jest.genMockFunction();

      mockFn('foo', 'bar');
      expect(mockFn).lastCalledWith('foo', 'bar');

      mockFn('another', 'bar');
      expect(mockFn).lastCalledWith('another', 'bar');
    });

    describe('jasmine spies', function() {
      it('is supported by toBeCalled', () => {
        const foo = {
          setBar: jest.genMockFunction(),
        };
        spyOn(foo, 'setBar');
        foo.setBar(123);
        expect(foo.setBar).toBeCalled();
      });

      it('is supported by lastCalledWith', () => {
        const foo = {
          setBar: jest.genMockFunction(),
        };
        spyOn(foo, 'setBar');

        foo.setBar(123);
        foo.setBar(456, 'another param');
        expect(foo.setBar).lastCalledWith(456, 'another param');
      });

      it('is supported by toBeCalledWith', () => {
        const foo = {
          setBar: jest.genMockFunction(),
        };
        spyOn(foo, 'setBar');

        foo.setBar(123);
        foo.setBar(456, 'another param');
        expect(foo.setBar).toBeCalledWith(123);
        expect(foo.setBar).toBeCalledWith(456, 'another param');
      });
    });
  });
});
