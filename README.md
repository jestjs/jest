# jest

Painless JavaScript Unit Testing

- **Familiar Approach**: Built on-top of the Jasmine test framework, keeping the learning curve low

- **Isolated by Default**: Integrates with require() in order to automatically mock dependencies, making most existing code testable

- **Short Feedback Loop**: Tests run in parallel and DOM apis are mocked so you can run tests on the command line


## Getting Started

Getting started with jest is pretty simple. All you need to do is:

* Write some (jasmine) tests in a `__tests__/` directory
* Run `npm install jest-cli --save-dev`
* Add the following to your `package.json`

```js
{
  ...
  "scripts": {
    "test": "jest"
  }
  ...
}
```

* Run `npm test`


## API

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

Timers

  - `.runTimersRepeatedly()`
  - `.runTimersOnce()`
  - `.runTicksRepeatedly()` used for Promises
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

(Jest)

  - `.toBeCalled()`
  - `.toBeCalledWith(arg, um, ents)`
  - `.lastCalledWith(arg, um, ents)`


#### Global variables


  - `require(module)`
  - `describe(name, fn)`
  - `it(name, fn)`
  - `beforeEach(fn)`
  - `afterEach(fn)`

(Jest)

  - `it.only(name, fn)` executes [only](https://github.com/davemo/jasmine-only) this test in the suite. Very useful when investigating a failure
  - `pit(name, fn)` helpers for [promises](https://www.npmjs.org/package/jasmine-pit)


#### Command line

[TODO]

#### package.json

 - `projectName`
 - `testPathDirs`
 - `testPathIgnores`
 - `moduleLoaderPathIgnores`
