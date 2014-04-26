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
