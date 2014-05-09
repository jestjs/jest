# [Jest](http://facebook.github.io/jest/)

Painless JavaScript Unit Testing

- **Familiar Approach**: Built on-top of the Jasmine test framework, keeping the learning curve low

- **Isolated by Default**: Integrates with require() in order to automatically mock dependencies, making most existing code testable

- **Short Feedback Loop**: Tests run in parallel and DOM apis are mocked so you can run tests on the command line

Take a look at the [website for more information](http://facebook.github.io/react/)

## Getting Started
<generated_getting_started>
Getting started with jest is pretty simple. If you want to test the following `sum.js` file,

```javascript
// sum.js
function sum(value1, value2) {
  return value1 + value2;
}
module.exports = sum;
```

1 - Create a directory `__tests__/` with a file `sum-test.js`

```javascript
// __tests__/sum-test.js
jest.dontMock('../sum');

describe('sum', function() {
  it('adds 1 + 1 to equal 2', function() {
    var sum = require('../sum');
    expect(sum(1, 2)).toBe(3);
  });
});
```

2 - Run `npm install jest-cli --save-dev`

3 - Add the following to your `package.json`

```js
{
  ...
  "scripts": {
    "test": "jest"
  }
  ...
}
```

4 - Run `npm test`

```
[PASS] __tests__/sum-test.js (0.015s)
```
</generated_getting_started>

## API

<generated_api>
#### `jest`

  - `.genMockFunction()` with alias `.genMockFn()`
    - `.mockImplementation(fn)`
    - `.mockReturnThis()`
    - `.mockReturnValue(value)`
    - `.mockReturnValueOnce(value)`
    - `.mock`
      - `.instances`
      - `.calls`
  - `.dontMock(module)`
  - `.mock(module)`
  - `.autoMockOff()`
  - `.autoMockOn()`
  - `.genMockFromModule()`
  - `.runTimersRepeatedly()`
  - `.runTimersOnce()`
  - `.runTicksRepeatedly()` helper for promises
  - `.clearTimers()`

#### `expect(value)`

  - `.not` inverse the next comparison
  - `.toThrow(?message)`
  - `.toBe(value)` comparison using `===`
  - `.toEqual(value)` deep comparison. Use [`jasmine.any(type)`](http://jasmine.github.io/1.3/introduction.html#section-Matching_Anything_with_<code>jasmine.any</code>) to be softer
  - `.toBeFalsy()`
  - `.toBeTruthy()`
  - `.toBeNull()`
  - `.toBeUndefined()`
  - `.toBeDefined()`
  - `.toMatch(regexp)`
  - `.toContain(string)`
  - `.toBeCloseTo(number, delta)`
  - `.toBeGreaterThan(number)`
  - `.toBeLessThan(number)`
  - `.toBeCalled()`
  - `.toBeCalledWith(arg, um, ents)`
  - `.lastCalledWith(arg, um, ents)`

#### Global variables

  - `require(module)`
  - `describe(name, fn)`
  - `beforeEach(fn)`
  - `afterEach(fn)`
  - `it(name, fn)`
  - `it.only(name, fn)` executes [only](https://github.com/davemo/jasmine-only) this test. Useful when investigating a failure
  - `pit(name, fn)` [helper](https://www.npmjs.org/package/jasmine-pit) for promises

#### package.json

  - `jest`
    - `projectName`
    - `testPathDirs`
    - `testPathIgnores`
    - `moduleLoaderPathIgnores`
</generated_api>
