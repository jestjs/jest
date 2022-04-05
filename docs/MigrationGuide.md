---
id: migration-guide
title: Migration to Jest 28
---

Upgrading Jest to the new version? This guide aims to make your migration smoother.

## Fake Timers

Fake timers were refactored to allow passing options to the underlying [`@sinonjs/fake-timers`](https://github.com/sinonjs/fake-timers).

### `fakeTimers`

The `timers` configuration option was renamed to [`fakeTimers`](Configuration.md#faketimers-object) and now takes an object with options:

```diff title="jest.config.js (default)"
- timers: 'real'
+ fakeTimers: {
+   enableGlobally: false
+ }
```

```diff title="jest.config.js"
- timers: 'fake'
+ fakeTimers: {
+   enableGlobally: true
+ }
```

```diff title="jest.config.js"
- timers: 'modern'
+ fakeTimers: {
+   enableGlobally: true
+ }
```

```diff title="jest.config.js"
- timers: 'legacy'
+ fakeTimers: {
+   enableGlobally: true,
+   legacyFakeTimers: true
+ }
```

### `jest.useFakeTimers()`

An object with options now should be passed to [`jest.useFakeTimers()`](JestObjectAPI.md#jestusefaketimersfaketimersconfig) as well:

```diff title="fakeTimers.test.js (default)"
- jest.useFakeTimers('modern')
+ jest.useFakeTimers()
```

Or if legacy fake timers are enabled in Jest config file, but you would like to use the default fake timers backed by `@sinonjs/fake-timers`:

```diff title="fakeTimers.test.js"
- jest.useFakeTimers('modern')
+ jest.useFakeTimers({
+   legacyFakeTimers: false
+ })
```

```diff title="fakeTimers.test.js"
- jest.useFakeTimers('legacy')
+ jest.useFakeTimers({
+   legacyFakeTimers: true
+ })
```

## Test Environment

If you are using JSDOM [test environment](Configuration.md#testenvironment-string), `jest-environment-jsdom` package now must be installed additionally:

```bash npm2yarn
npm install --save-dev jest-environment-jsdom
```

## Test Runner

If you are using Jasmine [test runner](Configuration.md#testrunner-string), `jest-jasmine2` package now must be installed additionally:

```bash npm2yarn
npm install --save-dev jest-jasmine2
```

## Migration from Other Testing Frameworks

If you'd like to try out Jest with an existing codebase, there are a number of ways to convert to Jest:

- If you are using Jasmine, or a Jasmine like API (for example [Mocha](https://mochajs.org)), Jest should be mostly compatible, which makes it less complicated to migrate to.
- If you are using AVA, Expect.js (by Automattic), Jasmine, Mocha, proxyquire, Should.js or Tape you can automatically migrate with Jest Codemods (see below).
- If you like [chai](http://chaijs.com/), you can upgrade to Jest and continue using chai. However, we recommend trying out Jest's assertions and their failure messages. Jest Codemods can migrate from chai (see below).

### `jest-codemods`

If you are using [AVA](https://github.com/avajs/ava), [Chai](https://github.com/chaijs/chai), [Expect.js (by Automattic)](https://github.com/Automattic/expect.js), [Jasmine](https://github.com/jasmine/jasmine), [Mocha](https://github.com/mochajs/mocha), [proxyquire](https://github.com/thlorenz/proxyquire), [Should.js](https://github.com/shouldjs/should.js) or [Tape](https://github.com/substack/tape) you can use the third-party [jest-codemods](https://github.com/skovhus/jest-codemods) to do most of the dirty migration work. It runs a code transformation on your codebase using [jscodeshift](https://github.com/facebook/jscodeshift).

To transform your existing tests, navigate to the project containing the tests and run:

```bash
npx jest-codemods
```

More information can be found at [https://github.com/skovhus/jest-codemods](https://github.com/skovhus/jest-codemods).
