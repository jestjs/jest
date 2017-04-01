/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
// This file is a heavily modified fork of Jasmine. Original license:
/*
Copyright (c) 2008-2016 Pivotal Labs

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
'use strict';

const ExpectationFailed = require('../ExpectationFailed');
const expectationResultFactory = require('../expectationResultFactory');

function Suite(attrs) {
  this.id = attrs.id;
  this.parentSuite = attrs.parentSuite;
  this.description = attrs.description;
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
  };
}

Suite.prototype.getFullName = function() {
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
};

Suite.prototype.disable = function() {
  this.disabled = true;
};

Suite.prototype.pend = function(message) {
  this.markedPending = true;
};

Suite.prototype.beforeEach = function(fn) {
  this.beforeFns.unshift(fn);
};

Suite.prototype.beforeAll = function(fn) {
  this.beforeAllFns.push(fn);
};

Suite.prototype.afterEach = function(fn) {
  this.afterFns.unshift(fn);
};

Suite.prototype.afterAll = function(fn) {
  this.afterAllFns.push(fn);
};

Suite.prototype.addChild = function(child) {
  this.children.push(child);
};

Suite.prototype.status = function() {
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
};

Suite.prototype.isExecutable = function() {
  return !this.disabled;
};

Suite.prototype.canBeReentered = function() {
  return this.beforeAllFns.length === 0 && this.afterAllFns.length === 0;
};

Suite.prototype.getResult = function() {
  this.result.status = this.status();
  return this.result;
};

Suite.prototype.sharedUserContext = function() {
  if (!this.sharedContext) {
    this.sharedContext = {};
  }

  return this.sharedContext;
};

Suite.prototype.clonedSharedUserContext = function() {
  return this.sharedUserContext();
};

Suite.prototype.onException = function() {
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
};

Suite.prototype.addExpectationResult = function() {
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
};

function isAfterAll(children) {
  return children && children[0].result.status;
}

function isFailure(args) {
  return !args[0];
}

module.exports = Suite;
