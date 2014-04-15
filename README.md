# jest

jest is a JavaScript testing library + CLI.

Its goal is to make writing JavaScript unit tests as easy and frictionless as possible while running the tests as fast as possible.

## Getting Started

Getting started with jest is pretty simple. All you need to do is:

* Write some tests in a `__tests__` directory (jest ships with jasmine out-of-the-box)
* Add the following two things to your `package.json` and then run `npm test`:

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

## Super Basic Example Module + Test

jest ships with support for jasmine out of the box:

__sum.js__:
```js
function sum(value1, value2) {
  return value1 + value;
}

module.exports = sum;
```
__\__tests\_\_/sum-test.js__:
```js
describe('sum', function() {
  var sum;
  
  beforeEach(function() {
    sum = require('../sum');
  });
  
  it('adds 1 + 1 to equal 2', function() {
    expect(sum(1, 2)).toBe(2);
  });
  
  // This test will fail!
  it('adds a scalar number to an array', function() {
    expect(sum(1, [1, 2])).toEqual([2, 3]);
  });
});
```
