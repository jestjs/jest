---
id: es6-class-mocks
title: ES6 Class Mocks
---

Jest can be used to mock ES6 classes that are imported into files you want to test.

ES6 classes are constructor functions with some syntactic sugar. Therefore, any mock for an ES6 class must be a function or an actual ES6 class (which is, again, another function). So you can mock them using [mock functions](MockFunctions.md).

## An ES6 Class Example

We'll use a contrived example of a class that plays sound files, `SoundPlayer`, and a consumer class which uses that class, `SoundPlayerConsumer`. We'll mock `SoundPlayer` in our tests for `SoundPlayerConsumer`.

```javascript title="sound-player.js"
export default class SoundPlayer {
  constructor() {
    this.foo = 'bar';
  }

  playSoundFile(fileName) {
    console.log('Playing sound file ' + fileName);
  }
}
```

```javascript title="sound-player-consumer.js"
import SoundPlayer from './sound-player';

export default class SoundPlayerConsumer {
  constructor() {
    this.soundPlayer = new SoundPlayer();
  }

  playSomethingCool() {
    const coolSoundFileName = 'song.mp3';
    this.soundPlayer.playSoundFile(coolSoundFileName);
  }
}
```

## The 4 ways to create an ES6 class mock

### Automatic mock

Calling `jest.mock('./sound-player')` returns a useful "automatic mock" you can use to spy on calls to the class constructor and all of its methods. It replaces the ES6 class with a mock constructor, and replaces all of its methods with [mock functions](MockFunctions.md) that always return `undefined`. Method calls are saved in `theAutomaticMock.mock.instances[index].methodName.mock.calls`.

:::note

If you use arrow functions in your classes, they will _not_ be part of the mock. The reason for that is that arrow functions are not present on the object's prototype, they are merely properties holding a reference to a function.

:::

If you don't need to replace the implementation of the class, this is the easiest option to set up. For example:

```javascript
import SoundPlayer from './sound-player';
import SoundPlayerConsumer from './sound-player-consumer';
jest.mock('./sound-player'); // SoundPlayer is now a mock constructor

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  SoundPlayer.mockClear();
});

it('We can check if the consumer called the class constructor', () => {
  const soundPlayerConsumer = new SoundPlayerConsumer();
  expect(SoundPlayer).toHaveBeenCalledTimes(1);
});

it('We can check if the consumer called a method on the class instance', () => {
  // Show that mockClear() is working:
  expect(SoundPlayer).not.toHaveBeenCalled();

  const soundPlayerConsumer = new SoundPlayerConsumer();
  // Constructor should have been called again:
  expect(SoundPlayer).toHaveBeenCalledTimes(1);

  const coolSoundFileName = 'song.mp3';
  soundPlayerConsumer.playSomethingCool();

  // mock.instances is available with automatic mocks:
  const mockSoundPlayerInstance = SoundPlayer.mock.instances[0];
  const mockPlaySoundFile = mockSoundPlayerInstance.playSoundFile;
  expect(mockPlaySoundFile.mock.calls[0][0]).toBe(coolSoundFileName);
  // Equivalent to above check:
  expect(mockPlaySoundFile).toHaveBeenCalledWith(coolSoundFileName);
  expect(mockPlaySoundFile).toHaveBeenCalledTimes(1);
});
```

### Manual mock

Create a [manual mock](ManualMocks.md) by saving a mock implementation in the `__mocks__` folder. This allows you to specify the implementation, and it can be used across test files.

```javascript title="__mocks__/sound-player.js"
// Import this named export into your test file:
export const mockPlaySoundFile = jest.fn();
const mock = jest.fn().mockImplementation(() => {
  return {playSoundFile: mockPlaySoundFile};
});

export default mock;
```

Import the mock and the mock method shared by all instances:

```javascript title="sound-player-consumer.test.js"
import SoundPlayer, {mockPlaySoundFile} from './sound-player';
import SoundPlayerConsumer from './sound-player-consumer';
jest.mock('./sound-player'); // SoundPlayer is now a mock constructor

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  SoundPlayer.mockClear();
  mockPlaySoundFile.mockClear();
});

it('We can check if the consumer called the class constructor', () => {
  const soundPlayerConsumer = new SoundPlayerConsumer();
  expect(SoundPlayer).toHaveBeenCalledTimes(1);
});

it('We can check if the consumer called a method on the class instance', () => {
  const soundPlayerConsumer = new SoundPlayerConsumer();
  const coolSoundFileName = 'song.mp3';
  soundPlayerConsumer.playSomethingCool();
  expect(mockPlaySoundFile).toHaveBeenCalledWith(coolSoundFileName);
});
```

### Calling [`jest.mock()`](JestObjectAPI.md#jestmockmodulename-factory-options) with the module factory parameter

`jest.mock(path, moduleFactory)` takes a **module factory** argument. A module factory is a function that returns the mock.

In order to mock a constructor function, the module factory must return a constructor function. In other words, the module factory must be a function that returns a function - a higher-order function (HOF).

```javascript
import SoundPlayer from './sound-player';
const mockPlaySoundFile = jest.fn();
jest.mock('./sound-player', () => {
  return jest.fn().mockImplementation(() => {
    return {playSoundFile: mockPlaySoundFile};
  });
});
```

:::caution

Since calls to `jest.mock()` are hoisted to the top of the file, Jest prevents access to out-of-scope variables. By default, you cannot first define a variable and then use it in the factory. Jest will disable this check for variables that start with the word `mock`. However, it is still up to you to guarantee that they will be initialized on time. Be aware of [Temporal Dead Zone](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone_tdz).

:::

For example, the following will throw an out-of-scope error due to the use of `fake` instead of `mock` in the variable declaration.

```javascript
// Note: this will fail
import SoundPlayer from './sound-player';
const fakePlaySoundFile = jest.fn();
jest.mock('./sound-player', () => {
  return jest.fn().mockImplementation(() => {
    return {playSoundFile: fakePlaySoundFile};
  });
});
```

The following will throw a `ReferenceError` despite using `mock` in the variable declaration, as the `mockSoundPlayer` is not wrapped in an arrow function and thus accessed before initialization after hoisting.

```javascript
import SoundPlayer from './sound-player';
const mockSoundPlayer = jest.fn().mockImplementation(() => {
  return {playSoundFile: mockPlaySoundFile};
});
// results in a ReferenceError
jest.mock('./sound-player', () => {
  return mockSoundPlayer;
});
```

### Replacing the mock using [`mockImplementation()`](MockFunctionAPI.md#mockfnmockimplementationfn) or [`mockImplementationOnce()`](MockFunctionAPI.md#mockfnmockimplementationoncefn)

You can replace all of the above mocks in order to change the implementation, for a single test or all tests, by calling `mockImplementation()` on the existing mock.

Calls to jest.mock are hoisted to the top of the code. You can specify a mock later, e.g. in `beforeAll()`, by calling `mockImplementation()` (or `mockImplementationOnce()`) on the existing mock instead of using the factory parameter. This also allows you to change the mock between tests, if needed:

```javascript
import SoundPlayer from './sound-player';
import SoundPlayerConsumer from './sound-player-consumer';

jest.mock('./sound-player');

describe('When SoundPlayer throws an error', () => {
  beforeAll(() => {
    SoundPlayer.mockImplementation(() => {
      return {
        playSoundFile: () => {
          throw new Error('Test error');
        },
      };
    });
  });

  it('Should throw an error when calling playSomethingCool', () => {
    const soundPlayerConsumer = new SoundPlayerConsumer();
    expect(() => soundPlayerConsumer.playSomethingCool()).toThrow();
  });
});
```

## In depth: Understanding mock constructor functions

Building your constructor function mock using `jest.fn().mockImplementation()` makes mocks appear more complicated than they really are. This section shows how you can create your own mocks to illustrate how mocking works.

### Manual mock that is another ES6 class

If you define an ES6 class using the same filename as the mocked class in the `__mocks__` folder, it will serve as the mock. This class will be used in place of the real class. This allows you to inject a test implementation for the class, but does not provide a way to spy on calls.

For the contrived example, the mock might look like this:

```javascript title="__mocks__/sound-player.js"
export default class SoundPlayer {
  constructor() {
    console.log('Mock SoundPlayer: constructor was called');
  }

  playSoundFile() {
    console.log('Mock SoundPlayer: playSoundFile was called');
  }
}
```

### Mock using module factory parameter

The module factory function passed to `jest.mock(path, moduleFactory)` can be a HOF that returns a function\*. This will allow calling `new` on the mock. Again, this allows you to inject different behavior for testing, but does not provide a way to spy on calls.

#### \* Module factory function must return a function

In order to mock a constructor function, the module factory must return a constructor function. In other words, the module factory must be a function that returns a function - a higher-order function (HOF).

```javascript
jest.mock('./sound-player', () => {
  return function () {
    return {playSoundFile: () => {}};
  };
});
```

:::note

The mock can't be an arrow function because calling `new` on an arrow function is not allowed in JavaScript. So this won't work:

```javascript
jest.mock('./sound-player', () => {
  return () => {
    // Does not work; arrow functions can't be called with new
    return {playSoundFile: () => {}};
  };
});
```

This will throw **_TypeError: \_soundPlayer2.default is not a constructor_**, unless the code is transpiled to ES5, e.g. by `@babel/preset-env`. (ES5 doesn't have arrow functions nor classes, so both will be transpiled to plain functions.)

:::

## Mocking a specific method of a class

Lets say that you want to mock or spy on the method `playSoundFile` within the class `SoundPlayer`. A simple example:

```javascript
// your jest test file below
import SoundPlayer from './sound-player';
import SoundPlayerConsumer from './sound-player-consumer';

const playSoundFileMock = jest
  .spyOn(SoundPlayer.prototype, 'playSoundFile')
  .mockImplementation(() => {
    console.log('mocked function');
  }); // comment this line if just want to "spy"

it('player consumer plays music', () => {
  const player = new SoundPlayerConsumer();
  player.playSomethingCool();
  expect(playSoundFileMock).toHaveBeenCalled();
});
```

### Static, getter and setter methods

Lets imagine our class `SoundPlayer` has a getter method `foo` and a static method `brand`

```javascript
export default class SoundPlayer {
  constructor() {
    this.foo = 'bar';
  }

  playSoundFile(fileName) {
    console.log('Playing sound file ' + fileName);
  }

  get foo() {
    return 'bar';
  }
  static brand() {
    return 'player-brand';
  }
}
```

You can mock/spy on them easily, here is an example:

```javascript
// your jest test file below
import SoundPlayer from './sound-player';

const staticMethodMock = jest
  .spyOn(SoundPlayer, 'brand')
  .mockImplementation(() => 'some-mocked-brand');

const getterMethodMock = jest
  .spyOn(SoundPlayer.prototype, 'foo', 'get')
  .mockImplementation(() => 'some-mocked-result');

it('custom methods are called', () => {
  const player = new SoundPlayer();
  const foo = player.foo;
  const brand = SoundPlayer.brand();

  expect(staticMethodMock).toHaveBeenCalled();
  expect(getterMethodMock).toHaveBeenCalled();
});
```

## Keeping track of usage (spying on the mock)

Injecting a test implementation is helpful, but you will probably also want to test whether the class constructor and methods are called with the correct parameters.

### Spying on the constructor

In order to track calls to the constructor, replace the function returned by the HOF with a Jest mock function. Create it with [`jest.fn()`](JestObjectAPI.md#jestfnimplementation), and then specify its implementation with `mockImplementation()`.

```javascript
import SoundPlayer from './sound-player';
jest.mock('./sound-player', () => {
  // Works and lets you check for constructor calls:
  return jest.fn().mockImplementation(() => {
    return {playSoundFile: () => {}};
  });
});
```

This will let us inspect usage of our mocked class, using `SoundPlayer.mock.calls`: `expect(SoundPlayer).toHaveBeenCalled();` or near-equivalent: `expect(SoundPlayer.mock.calls.length).toBeGreaterThan(0);`

### Mocking non-default class exports

If the class is **not** the default export from the module then you need to return an object with the key that is the same as the class export name.

```javascript
import {SoundPlayer} from './sound-player';
jest.mock('./sound-player', () => {
  // Works and lets you check for constructor calls:
  return {
    SoundPlayer: jest.fn().mockImplementation(() => {
      return {playSoundFile: () => {}};
    }),
  };
});
```

### Spying on methods of our class

Our mocked class will need to provide any member functions (`playSoundFile` in the example) that will be called during our tests, or else we'll get an error for calling a function that doesn't exist. But we'll probably want to also spy on calls to those methods, to ensure that they were called with the expected parameters.

A new object will be created each time the mock constructor function is called during tests. To spy on method calls in all of these objects, we populate `playSoundFile` with another mock function, and store a reference to that same mock function in our test file, so it's available during tests.

```javascript
import SoundPlayer from './sound-player';
const mockPlaySoundFile = jest.fn();
jest.mock('./sound-player', () => {
  return jest.fn().mockImplementation(() => {
    return {playSoundFile: mockPlaySoundFile};
    // Now we can track calls to playSoundFile
  });
});
```

The manual mock equivalent of this would be:

```javascript title="__mocks__/sound-player.js"
// Import this named export into your test file
export const mockPlaySoundFile = jest.fn();
const mock = jest.fn().mockImplementation(() => {
  return {playSoundFile: mockPlaySoundFile};
});

export default mock;
```

Usage is similar to the module factory function, except that you can omit the second argument from `jest.mock()`, and you must import the mocked method into your test file, since it is no longer defined there. Use the original module path for this; don't include `__mocks__`.

### Cleaning up between tests

To clear the record of calls to the mock constructor function and its methods, we call [`mockClear()`](MockFunctionAPI.md#mockfnmockclear) in the `beforeEach()` function:

```javascript
beforeEach(() => {
  SoundPlayer.mockClear();
  mockPlaySoundFile.mockClear();
});
```

## Complete example

Here's a complete test file which uses the module factory parameter to `jest.mock`:

```javascript title="sound-player-consumer.test.js"
import SoundPlayer from './sound-player';
import SoundPlayerConsumer from './sound-player-consumer';

const mockPlaySoundFile = jest.fn();
jest.mock('./sound-player', () => {
  return jest.fn().mockImplementation(() => {
    return {playSoundFile: mockPlaySoundFile};
  });
});

beforeEach(() => {
  SoundPlayer.mockClear();
  mockPlaySoundFile.mockClear();
});

it('The consumer should be able to call new() on SoundPlayer', () => {
  const soundPlayerConsumer = new SoundPlayerConsumer();
  // Ensure constructor created the object:
  expect(soundPlayerConsumer).toBeTruthy();
});

it('We can check if the consumer called the class constructor', () => {
  const soundPlayerConsumer = new SoundPlayerConsumer();
  expect(SoundPlayer).toHaveBeenCalledTimes(1);
});

it('We can check if the consumer called a method on the class instance', () => {
  const soundPlayerConsumer = new SoundPlayerConsumer();
  const coolSoundFileName = 'song.mp3';
  soundPlayerConsumer.playSomethingCool();
  expect(mockPlaySoundFile.mock.calls[0][0]).toBe(coolSoundFileName);
});
```
