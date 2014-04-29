# jest

jest is a JavaScript testing library + CLI.

Its goal is to make writing JavaScript unit tests as easy and frictionless as possible while running the tests as fast as possible.

- **All dependencies are mocked by default**. Test only the module you are testing and its interactions with other modules. Don't do integration testing by mistake.

- **Integrated with require()**. You don't need to refactor your code using DI to make it testable.

And some goodies:

- **Speed**. Because all the dependencies are mocked, tests are running much faster.

- **Using Jasmine**. Jest is dealing with dependencies, Jasmime for the actual tests.

- **Used at Facebook**. Thousands of tests are already running under Jest.


## Basic Example

```js
// sum.js
function sum(value1, value2) {
  return value1 + value2;
}
module.exports = sum;
```

```js
// __tests__/sum-test.js__:

// By default, jest will automatically generate a mock version for any module when it is
// require()'d. We tell jest not to mock out the 'sum' module so that we can test it.
require('mock-modules').dontMock('../sum');

describe('sum', function() {
  it('adds 1 + 1 to equal 2', function() {
    var sum = require('../sum');
    expect(sum(1, 2)).toBe(3);
  });
  it('adds a scalar number to an array', function() {
    var sum = require('../sum');
    // This test will fail!
    expect(sum(1, [1, 2])).toEqual([2, 3]);
  });
});
```

```js
// package.json
{
  ...
  "devDependencies": {
    "jest-cli": "*"
  },
  "scripts": {
    "test": "jest"
  }
}
```

Then run `npm test` and see the following:
```
Found 1 matching tests...
 FAIL  /Users/jeffmo/Projects/example/__tests__/sum-test.js (0.017s)
● sum › it adds a scalar number to an array
  - Expected: '11,2' toEqual: [2, 3]
        at null.<anonymous> (/Users/jeffmo/Projects/example/__tests__/sum-test.js:18:28)
1/1 tests failed
Run time: 0.797s
```
