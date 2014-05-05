---
id: api
title: API
layout: docs
category: Reference
permalink: api.html
previous: timer-mocks
---

`expect(value)`
------------

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


`jest`
----

  - `.genMockFunction()` with alias `.genMockFn()`
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


Global variables
----------------

  - `require(module)`
  - `describe(name, fn)`
  - `it(name, fn)`
  - `beforeEach(fn)`
  - `afterEach(fn)`

(Jest)

  - `it.only(name, fn)` executes [only](https://github.com/davemo/jasmine-only) this test in the suite. Very useful when investigating a failure
  - `pit(name, fn)` helpers for [promises](https://www.npmjs.org/package/jasmine-pit)


Command line
------------

[TODO]

package.json
------------

```javascript
{
  "projectName": "jest",
```

The directories where tests are
```javascript
  "testPathDirs": [
    "."
  ],
```

Regexes of test files to ignore
```javascript
  "testPathIgnores": [
    "/node_modules/"
  ],
```

Regexes of module files to ignore
```javascript
  "moduleLoaderPathIgnores": [
    "/node_modules/"
  ]
}
```
