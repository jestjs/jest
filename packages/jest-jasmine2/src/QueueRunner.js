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

function once(fn) {
  let called = false;
  return function() {
    if (!called) {
      called = true;
      fn();
    }
    return null;
  };
}

function QueueRunner(attrs) {
  this.queueableFns = attrs.queueableFns || [];
  this.onComplete = attrs.onComplete || function() {};
  this.clearStack = attrs.clearStack ||
    function(fn) {
      fn();
    };
  this.onException = attrs.onException || function() {};
  this.catchException = attrs.catchException ||
    function() {
      return true;
    };
  this.userContext = attrs.userContext || {};
  this.timeout = attrs.timeout || {
    setTimeout,
    clearTimeout,
  };
  this.fail = attrs.fail || function() {};
}

QueueRunner.prototype.execute = function() {
  this.run(this.queueableFns, 0);
};

QueueRunner.prototype.run = function(queueableFns, recursiveIndex) {
  const length = queueableFns.length;
  const self = this;
  let iterativeIndex;

  for (
    iterativeIndex = recursiveIndex;
    iterativeIndex < length;
    iterativeIndex++
  ) {
    const queueableFn = queueableFns[iterativeIndex];
    if (queueableFn.fn.length > 0) {
      attemptAsync(queueableFn);
      return;
    } else {
      attemptSync(queueableFn);
    }
  }

  const runnerDone = iterativeIndex >= length;

  if (runnerDone) {
    this.clearStack(this.onComplete);
  }

  function attemptSync(queueableFn) {
    try {
      queueableFn.fn.call(self.userContext);
    } catch (e) {
      handleException(e, queueableFn);
    }
  }

  function attemptAsync(queueableFn) {
    const clearTimeout = function() {
      Function.prototype.apply.apply(self.timeout.clearTimeout, [
        global,
        [timeoutId],
      ]);
    };
    const next = once(() => {
      clearTimeout(timeoutId);
      self.run(queueableFns, iterativeIndex + 1);
    });
    let timeoutId;

    next.fail = function() {
      self.fail.apply(null, arguments);
      next();
    };

    if (queueableFn.timeout) {
      timeoutId = Function.prototype.apply.apply(self.timeout.setTimeout, [
        global,
        [
          function() {
            const error = new Error(
              'Timeout - Async callback was not invoked within ' +
                'timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.',
            );
            onException(error);
            next();
          },
          queueableFn.timeout(),
        ],
      ]);
    }

    try {
      queueableFn.fn.call(self.userContext, next);
    } catch (e) {
      handleException(e, queueableFn);
      next();
    }
  }

  function onException(e) {
    self.onException(e);
  }

  function handleException(e, queueableFn) {
    onException(e);
    if (!self.catchException(e)) {
      throw e;
    }
  }
};

module.exports = QueueRunner
