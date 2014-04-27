# jest

jest is a JavaScript testing library + CLI.

Its goal is to make writing JavaScript unit tests as easy and frictionless as possible while running the tests as fast as possible. It currently only ships with jasmine support, but the longer-term roadmap includes more testing frameworks as well.

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

One of the most powerful features of jest is it's built-in mocking features. By default, when a test runs inside jest, it mocks all modules that are `require()`'d while running. This means you'll get a mocked version of the exports for any module you `require()` (rather than the real version).

The reason this is so powerful is because it makes it really easy to write tests that exercise only the code you wish to exercise -- nothing more, nothing less.

Let's look at an example to see what we mean:

__sum.js__
```js
var arraySum = require('./arraySum');

function sum(value1, value2) {
  // If we were given two arrays, use arraySum
  if (Array.isArray(value1) && Array.isArray(value2)) {
    return arraySum(value1, value2);
   
  // If we were given an array + a scalar, add the scalar to each item in the array
  } else if (Array.isArray(value1) && typeof value2 === 'number') {
  	return value1.map(entry => entry + value2);
  } else if (Array.isArray(value2) && typeof value1 === 'number') {
  	return value2.map(entry => entry + value1);
    
  // Bail out if we're given anything else
  } else {
  	throw new Error('Unexpected parameter types!');
  } 	
}
```

__arraySum.js__
```js
function arraySum(arr1, arr2) {
  var maxLength = Math.max(arr1.length, arr2.length);
  var summedArray = [];
  for (var i = 0; i < maxLength; i++) {
  	summedArray[i] = 0;
    if (i < arr1.length) {
      summedArray[i] += arr1[i];
    }
    if (i < arr2.length) {
      summedArray[i] += arr2[i];
    }
  }
  return summedArray;
}
```

Ok, so here we have two modules; One that depends on the other. In order to properly test all of this code, general best practice suggests that we should write separate tests for each of the modules. Cool, so let's write some tests!

__\_\_tests\_\_/arraySum-test.js__
```js
// Everything is mocked by default, but don't mock the arraySum.js file so we can test it
require('mock-modules').dontMock('../arraySum');

describe('arraySum', function() {
  it('adds empty arrays', function() {
    var arraySum = require('../arraySum');
    expect(arraySum([], [])).toEqual([]);
  });
  
  it('adds an empty array to a non-empty array', function() {
    var arraySum = require('../arraySum');
    expect(arraySum([], [1, 2])).toEqual([1, 2]);
  });
  
  it('adds two non-empty arrays', function() {
  	var arraySum = require('../arraySum');
    expect(arraySum([1, 2], [3, 4])).toEqual([4, 6]);
  });
});
```
