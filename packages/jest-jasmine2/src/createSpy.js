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

const CallTracker = require('./CallTracker');
const SpyStrategy = require('./SpyStrategy');

function createSpy(name, originalFn) {
  const spyStrategy = new SpyStrategy({
    name,
    fn: originalFn,
    getSpy() {
      return spy;
    },
  });
  const callTracker = new CallTracker();
  const spy = function() {
    const callData = {
      object: this,
      args: Array.prototype.slice.apply(arguments),
    };

    callTracker.track(callData);
    const returnValue = spyStrategy.exec.apply(this, arguments);
    callData.returnValue = returnValue;

    return returnValue;
  };

  for (const prop in originalFn) {
    if (prop === 'and' || prop === 'calls') {
      throw new Error(
        "Jasmine spies would overwrite the 'and' and 'calls' properties " +
          'on the object being spied upon',
      );
    }

    spy[prop] = originalFn[prop];
  }

  spy.and = spyStrategy;
  spy.calls = callTracker;

  return spy;
};

module.exports = createSpy;
