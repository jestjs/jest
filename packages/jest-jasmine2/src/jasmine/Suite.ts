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
/* eslint-disable sort-keys */

import {convertDescriptorToString} from 'jest-util';
import ExpectationFailed from '../ExpectationFailed';
import expectationResultFactory from '../expectationResultFactory';

export default class Suite {
  id: unknown;
  parentSuite: unknown;
  description: unknown;
  throwOnExpectationFailure: unknown;
  beforeFns: unknown;
  afterFns: unknown;
  beforeAllFns: unknown;
  afterAllFns: unknown;
  disabled: boolean;
  children: unknown;
  result: {
    id: unknown;
    description: unknown;
    fullName: string;
    failedExpectations: [];
    testPath: unknown;
  };
  markedPending: boolean;
  sharedContext: unknown;

  constructor(attrs: {
    id: unknown;
    parentSuite: unknown;
    description: unknown;
    throwOnExpectationFailure: unknown;
    getTestPath: () => unknown;
  }) {
    this.id = attrs.id;
    this.parentSuite = attrs.parentSuite;
    this.description = convertDescriptorToString(attrs.description);
    this.throwOnExpectationFailure = !!attrs.throwOnExpectationFailure;

    this.beforeFns = [];
    this.afterFns = [];
    this.beforeAllFns = [];
    this.afterAllFns = [];
    this.disabled = false;

    this.children = [];

    this.result = {
      id: this.id,
      description: this.description,
      fullName: this.getFullName(),
      failedExpectations: [],
      testPath: attrs.getTestPath(),
    };
  }
  getFullName() {
    const fullName = [];
    for (
      let parentSuite = this;
      parentSuite;
      parentSuite = parentSuite.parentSuite
    ) {
      if (parentSuite.parentSuite) {
        fullName.unshift(parentSuite.description);
      }
    }
    return fullName.join(' ');
  }
  disable() {
    this.disabled = true;
  }
  pend(message) {
    this.markedPending = true;
  }
  beforeEach(fn) {
    this.beforeFns.unshift(fn);
  }
  beforeAll(fn) {
    this.beforeAllFns.push(fn);
  }
  afterEach(fn) {
    this.afterFns.unshift(fn);
  }
  afterAll(fn) {
    this.afterAllFns.unshift(fn);
  }

  addChild(child) {
    this.children.push(child);
  }

  status() {
    if (this.disabled) {
      return 'disabled';
    }

    if (this.markedPending) {
      return 'pending';
    }

    if (this.result.failedExpectations.length > 0) {
      return 'failed';
    } else {
      return 'finished';
    }
  }

  isExecutable() {
    return !this.disabled;
  }

  canBeReentered() {
    return this.beforeAllFns.length === 0 && this.afterAllFns.length === 0;
  }

  getResult() {
    this.result.status = this.status();
    return this.result;
  }

  sharedUserContext() {
    if (!this.sharedContext) {
      this.sharedContext = {};
    }

    return this.sharedContext;
  }

  clonedSharedUserContext() {
    return this.sharedUserContext();
  }

  onException() {
    if (arguments[0] instanceof ExpectationFailed) {
      return;
    }

    if (isAfterAll(this.children)) {
      const data = {
        matcherName: '',
        passed: false,
        expected: '',
        actual: '',
        error: arguments[0],
      };
      this.result.failedExpectations.push(expectationResultFactory(data));
    } else {
      for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];
        child.onException.apply(child, arguments);
      }
    }
  }

  addExpectationResult() {
    if (isAfterAll(this.children) && isFailure(arguments)) {
      const data = arguments[1];
      this.result.failedExpectations.push(expectationResultFactory(data));
      if (this.throwOnExpectationFailure) {
        throw new ExpectationFailed();
      }
    } else {
      for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];
        try {
          child.addExpectationResult.apply(child, arguments);
        } catch (e) {
          // keep going
        }
      }
    }
  }
}

function isAfterAll(children) {
  return children && children[0] && children[0].result.status;
}

function isFailure(args) {
  return !args[0];
}
