/**
 * Copyright (c) 2015, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('mock-modules').autoMockOff();

describe('jasmineTestRunner', function() {

    //TODO: replace with actual unit tests?
    //TODO: enormous stack traces with jasmine2!
    // describe('failures', function() {

    //     it('handles exceptions', function() {
    //         throw new Error('surprise!');
    //     });

    //     it('handles match failures', function() {
    //         expect(true).toBe(false);
    //     });

    // });

    describe('custom matchers', function() {

        it('has toBeCalled', function() {

            var mockFn = jest.genMockFunction();

            mockFn();

            expect(mockFn).toBeCalled();

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


    });

});