/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// This file is a heavily modified fork of Jasmine. Original license:
/*
Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

export default class SpyStrategy {
  identity: () => string;
  exec: (...args: Array<any>) => unknown;
  callThrough: () => unknown;
  returnValue: (value: unknown) => unknown;
  returnValues: () => unknown;
  throwError: (something: string | Error) => unknown;
  callFake: (fn: Function) => unknown;
  stub: (fn: Function) => unknown;

  constructor({
    name = 'unknown',
    fn = function () {},
    getSpy = function () {},
  }: {name?: string; fn?: Function; getSpy?: () => unknown} = {}) {
    const identity = name;
    const originalFn = fn;
    let plan: Function = function () {};

    this.identity = function () {
      return identity;
    };

    this.exec = function () {
      return plan.apply(this, arguments);
    };

    this.callThrough = function () {
      plan = originalFn;
      return getSpy();
    };

    this.returnValue = function (value) {
      plan = function () {
        return value;
      };
      return getSpy();
    };

    this.returnValues = function () {
      const values = Array.prototype.slice.call(arguments);
      plan = function () {
        return values.shift();
      };
      return getSpy();
    };

    this.throwError = function (something) {
      const error =
        something instanceof Error ? something : new Error(something);
      plan = function () {
        throw error;
      };
      return getSpy();
    };

    this.callFake = function (fn) {
      if (typeof fn !== 'function') {
        throw new Error(
          'Argument passed to callFake should be a function, got ' + fn,
        );
      }
      plan = fn;
      return getSpy();
    };

    this.stub = function (_fn) {
      plan = function () {};
      return getSpy();
    };
  }
}
