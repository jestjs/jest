# jest

jest is a JavaScript testing library + CLI.

Its goal is to make writing JavaScript unit tests as easy and frictionless as possible while running the tests as fast as possible. It currently only ships with jasmine support, but I hope to support more testing frameworks as well in the longer term.

## Getting Started

Getting started with jest is pretty simple. All you need to do is:

* Write some (jasmine) tests in a `__tests__` directory
* Add the following two things to your `package.json`
* Run `npm test`:

```js
{
  ...
  "devDependencies": {
    "jest-cli": "*"
  },
  "scripts": {
    "test": "jest"
  }
  ...
}
```

## Basic Example

jest ships with support for jasmine out of the box, so here's an example of a simple module and a jasmine test for it:

__sum.js__:
```js
function sum(value1, value2) {
  return value1 + value2;
}

module.exports = sum;
```
__\_\_tests\_\_/sum-test.js__:
```js
// By default, jest will automatically generate a mock version for any module when it is
// require()'d.
// 
// Here, we tell jest not to mock out the 'sum' module so that we can test it.
require('mock-modules').dontMock('../sum');

describe('sum', function() {
  it('adds 1 + 1 to equal 2', function() {
    var sum = require('../sum');
    expect(sum(1, 2)).toBe(3);
  });
  
  // This test will fail!
  it('adds a scalar number to an array', function() {
    var sum = require('../sum');
    expect(sum(1, [1, 2])).toEqual([2, 3]);
  });
});
```

Now, if we're setup as described in the [Getting Started](#getting-started) section, we can run `npm test` and see the following:
```
$ npm test

Found 1 matching tests...
 FAIL  /Users/jeffmo/Projects/example/__tests__/sum-test.js (0.017s)
● sum › it adds a scalar number to an array
  - Expected: '11,2' toEqual: [2, 3]
        at null.<anonymous> (/Users/jeffmo/Projects/example/__tests__/sum-test.js:18:28)
1/1 tests failed
Run time: 0.797s
```

## Mocking

One of the most useful features of jest is it's built-in mocking capabilities. By default, when any module is executed inside jest, `require()` always returns an automatically generated mock version of the module (rather than the real version). This is really helpful because it makes easy to write tests that exercise only the code you wish -- nothing more, nothing less. Of course, you can (and probably should) customize this default behavior for your specific test.

Let's look at a more comprehensive version of our previous example, where we have a `sum.js` file that provides a function that can sum two values together -- whether they're numbers or arrays.

__sum.js__
```js
var throwInvariant = require('./throwInvariant');

function _arraySum(arr1, arr2) {
  var sumArray = [];
  var maxIndex = Math.max(arr1.length, arr2.length);
  for (var i = 0; i < maxIndex; i++) {
    sumArray[i] = 0;
    if (i < arr1.length) {
      sumArray[i] += arr1[i];
    }
    if (i < arr2.length) {
      sumArray[i] += arr2[i];
    }
  }
  return sumArray;
}

function sum(value1, value2) {
  // Fail early if either value is something other than a number or an
  // array (since those are the only two types we support)
  throwInvariant(
    typeof value1 !== 'number' && !Array.isArray(value1)
    || typeof value2 !== 'number' && !Array.isArray(value2),
    'Only numbers and arrays are currently supported!'
  );
  
  if (typeof value1 === 'number') {
    if (typeof value2 === 'number') {
      return value1 + value2;
    } else {
      // Yay! Simple, to-the-point ES6 arrow functions!
      return value2.map(item => item + value1);
    }
  } else if (typeof value2 === 'number') {
    return value1.map(item => item + value2);
  } else {
    return _arraySum(value1, value2);
  }
}

module.exports = sum;
```

Great, now we want to write a test for it:

__\_\_tests\_\_/sum-test.js__
```js
// Don't mock the 'sum' module, because we want to test it
require('mock-modules').dontMock('../sum');

describe('sum', function() {
  it('adds two numbers', function() {
    var sum = require('../sum');
    expect(sum(1, 2)).toBe(3);
  });
  
  it('adds a number to an array', function() {
    var sum = require('../sum');
    expect(sum(1, [2, 3])).toEqual([3, 4]);
  });
  
  it('adds an array to a number', function() {
    var sum = require('../sum');
    expect(sum([1, 2], 3)).toEqual([4, 6]);
  });
  
  it('adds two arrays', function() {
    var sum = require('../sum');
    expect(sum([1, 2], [3, 4])).toEqual([4, 6]);
  });
});
```

And we run it and...woohoo! Everything passes!

But we did leave out testing of one aspect of the module: It's error checking.
The `sum()` function will call `throwInvariant()` on its parameters to make sure they're types that are supported.

Presumably the `throwInvariant.js` function already has it's own tests that ensure that if you pass false as the first parameter, it throws an error...so it would be fairly redundent to assert that again in this test. Instead, it would be nice to just assert that the `throwInvariant()` function was called with `true` as the first argument for our `sum()` tests.

Fortunately jest automatically (by default) mocks out all `require()`'d modules. Mocks themselves record all calls that were made to them...so testing this should be really easy:

```js
// Don't mock the 'sum' module, because we want to test it
require('mock-modules').dontMock('../sum');

describe('sum', function() {
  
  // ...other tests we wrote above...
  
  it('calls throwInvariant() when a string is passed', function() {
    var sum = require('../sum');
    var throwInvariant = require('../throwInvariant');
    sum("invalid string", 42);
    
    // throwInvariant() should have been called exactly once
    expect(throwInvariant.mock.calls.length).toBe(1);
    
    // The first argument passed to the call to throwInvariant() 
    // should have been `false`
    var callArgs = throwInvariant.mock.calls[0];
    expect(callArgs[0]).toBe(false);
  });
});
```

So as you can see, when we `require()` the `throwInvariant` module, we don't get the real thing. We get a version of it that is a function with a `.mock` property on it. That `.mock` property has a bunch of interesting information about how the mock function was called during it's lifetime. Of specifically interesting use, it records every single call along with all the args passed in each call.

