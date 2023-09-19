---
id: jest-object
title: The Jest Object
---

The `jest` object is automatically in scope within every test file. The methods in the `jest` object help create mocks and let you control Jest's overall behavior. It can also be imported explicitly by via `import {jest} from '@jest/globals'`.

import TypeScriptExamplesNote from './_TypeScriptExamplesNote.md';

<TypeScriptExamplesNote />

## Methods

import TOCInline from '@theme/TOCInline';

<TOCInline toc={toc.slice(1)} />

---

## Mock Modules

### `jest.disableAutomock()`

Disables automatic mocking in the module loader.

:::info

Automatic mocking should be enabled via [`automock`](Configuration.md#automock-boolean) configuration option for this method to have any effect. Also see documentation of the configuration option for more details.

```js tab
/** @type {import('jest').Config} */
const config = {
  automock: true,
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  automock: true,
};

export default config;
```

:::

After `disableAutomock()` is called, all `require()`s will return the real versions of each module (rather than a mocked version).

```js title="utils.js"
export default {
  authorize: () => {
    return 'token';
  },
};
```

```js title="__tests__/disableAutomocking.js"
import utils from '../utils';

jest.disableAutomock();

test('original implementation', () => {
  // now we have the original implementation,
  // even if we set the automocking in a jest configuration
  expect(utils.authorize()).toBe('token');
});
```

This is usually useful when you have a scenario where the number of dependencies you want to mock is far less than the number of dependencies that you don't. For example, if you're writing a test for a module that uses a large number of dependencies that can be reasonably classified as "implementation details" of the module, then you likely do not want to mock them.

Examples of dependencies that might be considered "implementation details" are things ranging from language built-ins (e.g. `Array.prototype` methods) to highly common utility methods (e.g. `underscore`, `lodash`, array utilities, etc) and entire libraries like `React.js`.

Returns the `jest` object for chaining.

:::tip

When using `babel-jest`, calls to `disableAutomock()` will automatically be hoisted to the top of the code block. Use `autoMockOff()` if you want to explicitly avoid this behavior.

:::

### `jest.enableAutomock()`

Enables automatic mocking in the module loader.

:::info

For more details on automatic mocking see documentation of [`automock`](Configuration.md#automock-boolean) configuration option.

:::

Example:

```js title="utils.js"
export default {
  authorize: () => {
    return 'token';
  },
  isAuthorized: secret => secret === 'wizard',
};
```

```js title="__tests__/enableAutomocking.js"
jest.enableAutomock();

import utils from '../utils';

test('original implementation', () => {
  // now we have the mocked implementation,
  expect(utils.authorize._isMockFunction).toBeTruthy();
  expect(utils.isAuthorized._isMockFunction).toBeTruthy();
});
```

Returns the `jest` object for chaining.

:::tip

When using `babel-jest`, calls to `enableAutomock` will automatically be hoisted to the top of the code block. Use `autoMockOn` if you want to explicitly avoid this behavior.

:::

### `jest.createMockFromModule(moduleName)`

Given the name of a module, use the automatic mocking system to generate a mocked version of the module for you.

This is useful when you want to create a [manual mock](ManualMocks.md) that extends the automatic mock's behavior:

```js tab={"span":2} title="utils.js"
module.exports = {
  authorize: () => {
    return 'token';
  },
  isAuthorized: secret => secret === 'wizard',
};
```

```js title="__tests__/createMockFromModule.test.js"
const utils = jest.createMockFromModule('../utils');

utils.isAuthorized = jest.fn(secret => secret === 'not wizard');

test('implementation created by jest.createMockFromModule', () => {
  expect(jest.isMockFunction(utils.authorize)).toBe(true);
  expect(utils.isAuthorized('not wizard')).toBe(true);
});
```

```ts tab={"span":2} title="utils.ts"
export const utils = {
  authorize: () => {
    return 'token';
  },
  isAuthorized: (secret: string) => secret === 'wizard',
};
```

```ts title="__tests__/createMockFromModule.test.ts"
const {utils} =
  jest.createMockFromModule<typeof import('../utils')>('../utils');

utils.isAuthorized = jest.fn((secret: string) => secret === 'not wizard');

test('implementation created by jest.createMockFromModule', () => {
  expect(jest.isMockFunction(utils.authorize)).toBe(true);
  expect(utils.isAuthorized('not wizard')).toBe(true);
});
```

This is how `createMockFromModule` will mock the following data types:

#### `Function`

Creates a new [mock function](MockFunctionAPI.md). The new function has no formal parameters and when called will return `undefined`. This functionality also applies to `async` functions.

#### `Class`

Creates a new class. The interface of the original class is maintained, all of the class member functions and properties will be mocked.

#### `Object`

Creates a new deeply cloned object. The object keys are maintained and their values are mocked.

#### `Array`

Creates a new empty array, ignoring the original.

#### `Primitives`

Creates a new property with the same primitive value as the original property.

Example:

```js title="example.js"
module.exports = {
  function: function square(a, b) {
    return a * b;
  },
  asyncFunction: async function asyncSquare(a, b) {
    const result = (await a) * b;
    return result;
  },
  class: new (class Bar {
    constructor() {
      this.array = [1, 2, 3];
    }
    foo() {}
  })(),
  object: {
    baz: 'foo',
    bar: {
      fiz: 1,
      buzz: [1, 2, 3],
    },
  },
  array: [1, 2, 3],
  number: 123,
  string: 'baz',
  boolean: true,
  symbol: Symbol.for('a.b.c'),
};
```

```js title="__tests__/example.test.js"
const example = jest.createMockFromModule('../example');

test('should run example code', () => {
  // creates a new mocked function with no formal arguments.
  expect(example.function.name).toBe('square');
  expect(example.function).toHaveLength(0);

  // async functions get the same treatment as standard synchronous functions.
  expect(example.asyncFunction.name).toBe('asyncSquare');
  expect(example.asyncFunction).toHaveLength(0);

  // creates a new class with the same interface, member functions and properties are mocked.
  expect(example.class.constructor.name).toBe('Bar');
  expect(example.class.foo.name).toBe('foo');
  expect(example.class.array).toHaveLength(0);

  // creates a deeply cloned version of the original object.
  expect(example.object).toEqual({
    baz: 'foo',
    bar: {
      fiz: 1,
      buzz: [],
    },
  });

  // creates a new empty array, ignoring the original array.
  expect(example.array).toHaveLength(0);

  // creates a new property with the same primitive value as the original property.
  expect(example.number).toBe(123);
  expect(example.string).toBe('baz');
  expect(example.boolean).toBe(true);
  expect(example.symbol).toEqual(Symbol.for('a.b.c'));
});
```

### `jest.mock(moduleName, factory, options)`

Mocks a module with an auto-mocked version when it is being required. `factory` and `options` are optional. For example:

```js title="banana.js"
module.exports = () => 'banana';
```

```js title="__tests__/test.js"
jest.mock('../banana');

const banana = require('../banana'); // banana will be explicitly mocked.

banana(); // will return 'undefined' because the function is auto-mocked.
```

The second argument can be used to specify an explicit module factory that is being run instead of using Jest's automocking feature:

```js tab
jest.mock('../moduleName', () => {
  return jest.fn(() => 42);
});

// This runs the function specified as second argument to `jest.mock`.
const moduleName = require('../moduleName');
moduleName(); // Will return '42';
```

```ts tab
// The optional type argument provides typings for the module factory
jest.mock<typeof import('../moduleName')>('../moduleName', () => {
  return jest.fn(() => 42);
});

// This runs the function specified as second argument to `jest.mock`.
const moduleName = require('../moduleName');
moduleName(); // Will return '42';
```

When using the `factory` parameter for an ES6 module with a default export, the `__esModule: true` property needs to be specified. This property is normally generated by Babel / TypeScript, but here it needs to be set manually. When importing a default export, it's an instruction to import the property named `default` from the export object:

```js
import moduleName, {foo} from '../moduleName';

jest.mock('../moduleName', () => {
  return {
    __esModule: true,
    default: jest.fn(() => 42),
    foo: jest.fn(() => 43),
  };
});

moduleName(); // Will return 42
foo(); // Will return 43
```

The third argument can be used to create virtual mocks – mocks of modules that don't exist anywhere in the system:

```js
jest.mock(
  '../moduleName',
  () => {
    /*
     * Custom implementation of a module that doesn't exist in JS,
     * like a generated module or a native module in react-native.
     */
  },
  {virtual: true},
);
```

:::caution

Importing a module in a setup file (as specified by [`setupFilesAfterEnv`](Configuration.md#setupfilesafterenv-array)) will prevent mocking for the module in question, as well as all the modules that it imports.

:::

Modules that are mocked with `jest.mock` are mocked only for the file that calls `jest.mock`. Another file that imports the module will get the original implementation even if it runs after the test file that mocks the module.

Returns the `jest` object for chaining.

:::tip

Writing tests in TypeScript? Use the [`jest.Mocked`](MockFunctionAPI.md/#jestmockedsource) utility type or the [`jest.mocked()`](MockFunctionAPI.md/#jestmockedsource-options) helper method to have your mocked modules typed.

:::

### `jest.Mocked<Source>`

See [TypeScript Usage](MockFunctionAPI.md/#jestmockedsource) chapter of Mock Functions page for documentation.

### `jest.mocked(source, options?)`

See [TypeScript Usage](MockFunctionAPI.md/#jestmockedsource-options) chapter of Mock Functions page for documentation.

### `jest.unmock(moduleName)`

Indicates that the module system should never return a mocked version of the specified module from `require()` (e.g. that it should always return the real module).

The most common use of this API is for specifying the module a given test intends to be testing (and thus doesn't want automatically mocked).

Returns the `jest` object for chaining.

### `jest.deepUnmock(moduleName)`

Indicates that the module system should never return a mocked version of the specified module and its dependencies.

Returns the `jest` object for chaining.

### `jest.doMock(moduleName, factory, options)`

When using `babel-jest`, calls to `mock` will automatically be hoisted to the top of the code block. Use this method if you want to explicitly avoid this behavior.

One example when this is useful is when you want to mock a module differently within the same file:

```js tab
beforeEach(() => {
  jest.resetModules();
});

test('moduleName 1', () => {
  jest.doMock('../moduleName', () => {
    return jest.fn(() => 1);
  });
  const moduleName = require('../moduleName');
  expect(moduleName()).toBe(1);
});

test('moduleName 2', () => {
  jest.doMock('../moduleName', () => {
    return jest.fn(() => 2);
  });
  const moduleName = require('../moduleName');
  expect(moduleName()).toBe(2);
});
```

```ts tab
beforeEach(() => {
  jest.resetModules();
});

test('moduleName 1', () => {
  // The optional type argument provides typings for the module factory
  jest.doMock<typeof import('../moduleName')>('../moduleName', () => {
    return jest.fn(() => 1);
  });
  const moduleName = require('../moduleName');
  expect(moduleName()).toBe(1);
});

test('moduleName 2', () => {
  jest.doMock<typeof import('../moduleName')>('../moduleName', () => {
    return jest.fn(() => 2);
  });
  const moduleName = require('../moduleName');
  expect(moduleName()).toBe(2);
});
```

Using `jest.doMock()` with ES6 imports requires additional steps. Follow these if you don't want to use `require` in your tests:

- We have to specify the `__esModule: true` property (see the [`jest.mock()`](#jestmockmodulename-factory-options) API for more information).
- Static ES6 module imports are hoisted to the top of the file, so instead we have to import them dynamically using `import()`.
- Finally, we need an environment which supports dynamic importing. Please see [Using Babel](GettingStarted.md#using-babel) for the initial setup. Then add the plugin [babel-plugin-dynamic-import-node](https://www.npmjs.com/package/babel-plugin-dynamic-import-node), or an equivalent, to your Babel config to enable dynamic importing in Node.

```js
beforeEach(() => {
  jest.resetModules();
});

test('moduleName 1', () => {
  jest.doMock('../moduleName', () => {
    return {
      __esModule: true,
      default: 'default1',
      foo: 'foo1',
    };
  });
  return import('../moduleName').then(moduleName => {
    expect(moduleName.default).toBe('default1');
    expect(moduleName.foo).toBe('foo1');
  });
});

test('moduleName 2', () => {
  jest.doMock('../moduleName', () => {
    return {
      __esModule: true,
      default: 'default2',
      foo: 'foo2',
    };
  });
  return import('../moduleName').then(moduleName => {
    expect(moduleName.default).toBe('default2');
    expect(moduleName.foo).toBe('foo2');
  });
});
```

Returns the `jest` object for chaining.

### `jest.dontMock(moduleName)`

When using `babel-jest`, calls to `unmock` will automatically be hoisted to the top of the code block. Use this method if you want to explicitly avoid this behavior.

Returns the `jest` object for chaining.

### `jest.setMock(moduleName, moduleExports)`

Explicitly supplies the mock object that the module system should return for the specified module.

On occasion, there are times where the automatically generated mock the module system would normally provide you isn't adequate enough for your testing needs. Normally under those circumstances you should write a [manual mock](ManualMocks.md) that is more adequate for the module in question. However, on extremely rare occasions, even a manual mock isn't suitable for your purposes and you need to build the mock yourself inside your test.

In these rare scenarios you can use this API to manually fill the slot in the module system's mock-module registry.

Returns the `jest` object for chaining.

:::info

It is recommended to use [`jest.mock()`](#jestmockmodulename-factory-options) instead. The `jest.mock` API's second argument is a module factory instead of the expected exported module object.

:::

### `jest.requireActual(moduleName)`

Returns the actual module instead of a mock, bypassing all checks on whether the module should receive a mock implementation or not.

```js tab
jest.mock('../myModule', () => {
  // Require the original module to not be mocked...
  const originalModule = jest.requireActual('../myModule');

  return {
    __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    getRandom: jest.fn(() => 10),
  };
});

const getRandom = require('../myModule').getRandom;

getRandom(); // Always returns 10
```

```ts tab
jest.mock('../myModule', () => {
  // Require the original module to not be mocked...
  const originalModule =
    jest.requireActual<typeof import('../myModule')>('../myModule');

  return {
    __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    getRandom: jest.fn(() => 10),
  };
});

const getRandom = require('../myModule').getRandom;

getRandom(); // Always returns 10
```

### `jest.requireMock(moduleName)`

Returns a mock module instead of the actual module, bypassing all checks on whether the module should be required normally or not.

### `jest.resetModules()`

Resets the module registry - the cache of all required modules. This is useful to isolate modules where local state might conflict between tests.

Example:

```js
const sum1 = require('../sum');
jest.resetModules();
const sum2 = require('../sum');
sum1 === sum2;
// > false (Both sum modules are separate "instances" of the sum module.)
```

Example in a test:

```js
beforeEach(() => {
  jest.resetModules();
});

test('works', () => {
  const sum = require('../sum');
});

test('works too', () => {
  const sum = require('../sum');
  // sum is a different copy of the sum module from the previous test.
});
```

Returns the `jest` object for chaining.

### `jest.isolateModules(fn)`

`jest.isolateModules(fn)` goes a step further than `jest.resetModules()` and creates a sandbox registry for the modules that are loaded inside the callback function. This is useful to isolate specific modules for every test so that local module state doesn't conflict between tests.

```js
let myModule;
jest.isolateModules(() => {
  myModule = require('myModule');
});

const otherCopyOfMyModule = require('myModule');
```

### `jest.isolateModulesAsync(fn)`

`jest.isolateModulesAsync()` is the equivalent of `jest.isolateModules()`, but for async callbacks. The caller is expected to `await` the completion of `isolateModulesAsync`.

```js
let myModule;
await jest.isolateModulesAsync(async () => {
  myModule = await import('myModule');
  // do async stuff here
});

const otherCopyOfMyModule = await import('myModule');
```

## Mock Functions

### `jest.fn(implementation?)`

Returns a new, unused [mock function](MockFunctionAPI.md). Optionally takes a mock implementation.

```js
const mockFn = jest.fn();
mockFn();
expect(mockFn).toHaveBeenCalled();

// With a mock implementation:
const returnsTrue = jest.fn(() => true);
console.log(returnsTrue()); // true;
```

:::tip

See the [Mock Functions](MockFunctionAPI.md#jestfnimplementation) page for details on TypeScript usage.

:::

### `jest.isMockFunction(fn)`

Determines if the given function is a mocked function.

### `jest.replaceProperty(object, propertyKey, value)`

Replace `object[propertyKey]` with a `value`. The property must already exist on the object. The same property might be replaced multiple times. Returns a Jest [replaced property](MockFunctionAPI.md#replaced-properties).

:::note

To mock properties that are defined as getters or setters, use [`jest.spyOn(object, methodName, accessType)`](#jestspyonobject-methodname-accesstype) instead. To mock functions, use [`jest.spyOn(object, methodName)`](#jestspyonobject-methodname) instead.

:::

:::tip

All properties replaced with `jest.replaceProperty` could be restored to the original value by calling [jest.restoreAllMocks](#jestrestoreallmocks) on [afterEach](GlobalAPI.md#aftereachfn-timeout) method.

:::

Example:

```js
const utils = {
  isLocalhost() {
    return process.env.HOSTNAME === 'localhost';
  },
};

module.exports = utils;
```

Example test:

```js
const utils = require('./utils');

afterEach(() => {
  // restore replaced property
  jest.restoreAllMocks();
});

test('isLocalhost returns true when HOSTNAME is localhost', () => {
  jest.replaceProperty(process, 'env', {HOSTNAME: 'localhost'});
  expect(utils.isLocalhost()).toBe(true);
});

test('isLocalhost returns false when HOSTNAME is not localhost', () => {
  jest.replaceProperty(process, 'env', {HOSTNAME: 'not-localhost'});
  expect(utils.isLocalhost()).toBe(false);
});
```

### `jest.spyOn(object, methodName)`

Creates a mock function similar to `jest.fn` but also tracks calls to `object[methodName]`. Returns a Jest [mock function](MockFunctionAPI.md).

:::note

By default, `jest.spyOn` also calls the **spied** method. This is different behavior from most other test libraries. If you want to overwrite the original function, you can use `jest.spyOn(object, methodName).mockImplementation(() => customImplementation)` or `object[methodName] = jest.fn(() => customImplementation)`.

:::

:::tip

Since `jest.spyOn` is a mock, you could restore the initial state by calling [`jest.restoreAllMocks`](#jestrestoreallmocks) in the body of the callback passed to the [afterEach](GlobalAPI.md#aftereachfn-timeout) hook.

:::

Example:

```js
const video = {
  play() {
    return true;
  },
};

module.exports = video;
```

Example test:

```js
const video = require('./video');

afterEach(() => {
  // restore the spy created with spyOn
  jest.restoreAllMocks();
});

test('plays video', () => {
  const spy = jest.spyOn(video, 'play');
  const isPlaying = video.play();

  expect(spy).toHaveBeenCalled();
  expect(isPlaying).toBe(true);
});
```

### `jest.spyOn(object, methodName, accessType?)`

Since Jest 22.1.0+, the `jest.spyOn` method takes an optional third argument of `accessType` that can be either `'get'` or `'set'`, which proves to be useful when you want to spy on a getter or a setter, respectively.

Example:

```js
const video = {
  // it's a getter!
  get play() {
    return true;
  },
};

module.exports = video;

const audio = {
  _volume: false,
  // it's a setter!
  set volume(value) {
    this._volume = value;
  },
  get volume() {
    return this._volume;
  },
};

module.exports = audio;
```

Example test:

```js
const audio = require('./audio');
const video = require('./video');

afterEach(() => {
  // restore the spy created with spyOn
  jest.restoreAllMocks();
});

test('plays video', () => {
  const spy = jest.spyOn(video, 'play', 'get'); // we pass 'get'
  const isPlaying = video.play();

  expect(spy).toHaveBeenCalled();
  expect(isPlaying).toBe(true);
});

test('plays audio', () => {
  const spy = jest.spyOn(audio, 'volume', 'set'); // we pass 'set'
  audio.volume = 100;

  expect(spy).toHaveBeenCalled();
  expect(audio.volume).toBe(100);
});
```

### `jest.Replaced<Source>`

See [TypeScript Usage](MockFunctionAPI.md#replacedpropertyreplacevaluevalue) chapter of Mock Functions page for documentation.

### `jest.Spied<Source>`

See [TypeScript Usage](MockFunctionAPI.md#jestspiedsource) chapter of Mock Functions page for documentation.

### `jest.clearAllMocks()`

Clears the `mock.calls`, `mock.instances`, `mock.contexts` and `mock.results` properties of all mocks. Equivalent to calling [`.mockClear()`](MockFunctionAPI.md#mockfnmockclear) on every mocked function.

Returns the `jest` object for chaining.

### `jest.resetAllMocks()`

Resets the state of all mocks. Equivalent to calling [`.mockReset()`](MockFunctionAPI.md#mockfnmockreset) on every mocked function.

Returns the `jest` object for chaining.

### `jest.restoreAllMocks()`

Restores all mocks and replaced properties back to their original value. Equivalent to calling [`.mockRestore()`](MockFunctionAPI.md#mockfnmockrestore) on every mocked function and [`.restore()`](MockFunctionAPI.md#replacedpropertyrestore) on every replaced property. Beware that `jest.restoreAllMocks()` only works for mocks created with [`jest.spyOn()`](#jestspyonobject-methodname) and properties replaced with [`jest.replaceProperty()`](#jestreplacepropertyobject-propertykey-value); other mocks will require you to manually restore them.

## Fake Timers

### `jest.useFakeTimers(fakeTimersConfig?)`

Instructs Jest to use fake versions of the global date, performance, time and timer APIs. Fake timers implementation is backed by [`@sinonjs/fake-timers`](https://github.com/sinonjs/fake-timers).

Fake timers will swap out `Date`, `performance.now()`, `queueMicrotask()`, `setImmediate()`, `clearImmediate()`, `setInterval()`, `clearInterval()`, `setTimeout()`, `clearTimeout()` with an implementation that gets its time from the fake clock.

In Node environment `process.hrtime`, `process.nextTick()` and in JSDOM environment `requestAnimationFrame()`, `cancelAnimationFrame()`, `requestIdleCallback()`, `cancelIdleCallback()` will be replaced as well.

Configuration options:

```ts
type FakeableAPI =
  | 'Date'
  | 'hrtime'
  | 'nextTick'
  | 'performance'
  | 'queueMicrotask'
  | 'requestAnimationFrame'
  | 'cancelAnimationFrame'
  | 'requestIdleCallback'
  | 'cancelIdleCallback'
  | 'setImmediate'
  | 'clearImmediate'
  | 'setInterval'
  | 'clearInterval'
  | 'setTimeout'
  | 'clearTimeout';

type FakeTimersConfig = {
  /**
   * If set to `true` all timers will be advanced automatically by 20 milliseconds
   * every 20 milliseconds. A custom time delta may be provided by passing a number.
   * The default is `false`.
   */
  advanceTimers?: boolean | number;
  /**
   * List of names of APIs that should not be faked. The default is `[]`, meaning
   * all APIs are faked.
   */
  doNotFake?: Array<FakeableAPI>;
  /**
   * Use the old fake timers implementation instead of one backed by `@sinonjs/fake-timers`.
   * The default is `false`.
   */
  legacyFakeTimers?: boolean;
  /** Sets current system time to be used by fake timers. The default is `Date.now()`. */
  now?: number | Date;
  /**
   * The maximum number of recursive timers that will be run when calling `jest.runAllTimers()`.
   * The default is `100_000` timers.
   */
  timerLimit?: number;
};
```

Calling `jest.useFakeTimers()` will use fake timers for all tests within the file, until original timers are restored with `jest.useRealTimers()`.

You can call `jest.useFakeTimers()` or `jest.useRealTimers()` from anywhere: top level, inside an `test` block, etc. Keep in mind that this is a **global operation** and will affect other tests within the same file. Calling `jest.useFakeTimers()` once again in the same test file would reset the internal state (e.g. timer count) and reinstall fake timers using the provided options:

```js
test('advance the timers automatically', () => {
  jest.useFakeTimers({advanceTimers: true});
  // ...
});

test('do not advance the timers and do not fake `performance`', () => {
  jest.useFakeTimers({doNotFake: ['performance']});
  // ...
});

test('uninstall fake timers for the rest of tests in the file', () => {
  jest.useRealTimers();
  // ...
});
```

:::info Legacy Fake Timers

For some reason you might have to use legacy implementation of fake timers. It can be enabled like this (additional options are not supported):

```js
jest.useFakeTimers({
  legacyFakeTimers: true,
});
```

Legacy fake timers will swap out `setImmediate()`, `clearImmediate()`, `setInterval()`, `clearInterval()`, `setTimeout()`, `clearTimeout()` with Jest [mock functions](MockFunctionAPI.md). In Node environment `process.nextTick()` and in JSDOM environment `requestAnimationFrame()`, `cancelAnimationFrame()` will be also replaced.

:::

Returns the `jest` object for chaining.

### `jest.useRealTimers()`

Instructs Jest to restore the original implementations of the global date, performance, time and timer APIs. For example, you may call `jest.useRealTimers()` inside `afterEach` hook to restore timers after each test:

```js
afterEach(() => {
  jest.useRealTimers();
});

test('do something with fake timers', () => {
  jest.useFakeTimers();
  // ...
});

test('do something with real timers', () => {
  // ...
});
```

Returns the `jest` object for chaining.

### `jest.runAllTicks()`

Exhausts the **micro**-task queue (usually interfaced in node via `process.nextTick`).

When this API is called, all pending micro-tasks that have been queued via `process.nextTick` will be executed. Additionally, if those micro-tasks themselves schedule new micro-tasks, those will be continually exhausted until there are no more micro-tasks remaining in the queue.

### `jest.runAllTimers()`

Exhausts both the **macro**-task queue (i.e., all tasks queued by `setTimeout()`, `setInterval()`, and `setImmediate()`) and the **micro**-task queue (usually interfaced in node via `process.nextTick`).

When this API is called, all pending macro-tasks and micro-tasks will be executed. If those tasks themselves schedule new tasks, those will be continually exhausted until there are no more tasks remaining in the queue.

This is often useful for synchronously executing setTimeouts during a test in order to synchronously assert about some behavior that would only happen after the `setTimeout()` or `setInterval()` callbacks executed. See the [Timer mocks](TimerMocks.md) doc for more information.

### `jest.runAllTimersAsync()`

Asynchronous equivalent of `jest.runAllTimers()`. It allows any scheduled promise callbacks to execute _before_ running the timers.

:::info

This function is not available when using legacy fake timers implementation.

:::

### `jest.runAllImmediates()`

Exhausts all tasks queued by `setImmediate()`.

:::info

This function is only available when using legacy fake timers implementation.

:::

### `jest.advanceTimersByTime(msToRun)`

Executes only the macro task queue (i.e. all tasks queued by `setTimeout()` or `setInterval()` and `setImmediate()`).

When this API is called, all timers are advanced by `msToRun` milliseconds. All pending "macro-tasks" that have been queued via `setTimeout()` or `setInterval()`, and would be executed within this time frame will be executed. Additionally, if those macro-tasks schedule new macro-tasks that would be executed within the same time frame, those will be executed until there are no more macro-tasks remaining in the queue, that should be run within `msToRun` milliseconds.

### `jest.advanceTimersByTimeAsync(msToRun)`

Asynchronous equivalent of `jest.advanceTimersByTime(msToRun)`. It allows any scheduled promise callbacks to execute _before_ running the timers.

:::info

This function is not available when using legacy fake timers implementation.

:::

### `jest.runOnlyPendingTimers()`

Executes only the macro-tasks that are currently pending (i.e., only the tasks that have been queued by `setTimeout()` or `setInterval()` up to this point). If any of the currently pending macro-tasks schedule new macro-tasks, those new tasks will not be executed by this call.

This is useful for scenarios such as one where the module being tested schedules a `setTimeout()` whose callback schedules another `setTimeout()` recursively (meaning the scheduling never stops). In these scenarios, it's useful to be able to run forward in time by a single step at a time.

### `jest.runOnlyPendingTimersAsync()`

Asynchronous equivalent of `jest.runOnlyPendingTimers()`. It allows any scheduled promise callbacks to execute _before_ running the timers.

:::info

This function is not available when using legacy fake timers implementation.

:::

### `jest.advanceTimersToNextTimer(steps)`

Advances all timers by the needed milliseconds so that only the next timeouts/intervals will run.

Optionally, you can provide `steps`, so it will run `steps` amount of next timeouts/intervals.

### `jest.advanceTimersToNextTimerAsync(steps)`

Asynchronous equivalent of `jest.advanceTimersToNextTimer(steps)`. It allows any scheduled promise callbacks to execute _before_ running the timers.

:::info

This function is not available when using legacy fake timers implementation.

:::

### `jest.clearAllTimers()`

Removes any pending timers from the timer system.

This means, if any timers have been scheduled (but have not yet executed), they will be cleared and will never have the opportunity to execute in the future.

### `jest.getTimerCount()`

Returns the number of fake timers still left to run.

### `jest.now()`

Returns the time in ms of the current clock. This is equivalent to `Date.now()` if real timers are in use, or if `Date` is mocked. In other cases (such as legacy timers) it may be useful for implementing custom mocks of `Date.now()`, `performance.now()`, etc.

### `jest.setSystemTime(now?: number | Date)`

Set the current system time used by fake timers. Simulates a user changing the system clock while your program is running. It affects the current time but it does not in itself cause e.g. timers to fire; they will fire exactly as they would have done without the call to `jest.setSystemTime()`.

:::info

This function is not available when using legacy fake timers implementation.

:::

### `jest.getRealSystemTime()`

When mocking time, `Date.now()` will also be mocked. If you for some reason need access to the real current time, you can invoke this function.

:::info

This function is not available when using legacy fake timers implementation.

:::

## Misc

### `jest.getSeed()`

Every time Jest runs a seed value is randomly generated which you could use in a pseudorandom number generator or anywhere else.

:::tip

Use the [`--showSeed`](CLI.md#--showseed) flag to print the seed in the test report summary. To manually set the value of the seed use [`--seed=<num>`](CLI.md#--seednum) CLI argument.

:::

### `jest.isEnvironmentTornDown()`

Returns `true` if test environment has been torn down.

### `jest.retryTimes(numRetries, options?)`

Runs failed tests n-times until they pass or until the max number of retries is exhausted.

```js
jest.retryTimes(3);

test('will fail', () => {
  expect(true).toBe(false);
});
```

If `logErrorsBeforeRetry` option is enabled, error(s) that caused the test to fail will be logged to the console.

```js
jest.retryTimes(3, {logErrorsBeforeRetry: true});

test('will fail', () => {
  expect(true).toBe(false);
});
```

Returns the `jest` object for chaining.

:::caution

`jest.retryTimes()` must be declared at the top level of a test file or in a `describe` block.

:::

:::info

This function is only available with the default [jest-circus](https://github.com/jestjs/jest/tree/main/packages/jest-circus) runner.

:::

### `jest.setTimeout(timeout)`

Set the default timeout interval (in milliseconds) for all tests and before/after hooks in the test file. This only affects the test file from which this function is called. The default timeout interval is 5 seconds if this method is not called.

Example:

```js
jest.setTimeout(1000); // 1 second
```

:::tip

To set timeout intervals on different tests in the same file, use the [`timeout` option on each individual test](GlobalAPI.md#testname-fn-timeout).

If you want to set the timeout for all test files, use [`testTimeout`](Configuration.md#testtimeout-number) configuration option.

:::
