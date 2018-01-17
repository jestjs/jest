---
id: es6-class-mocks
title: ES6 Class Mocks
---
Jest can be used to mock ES6 classes that are imported into files you want to test.

ES6 classes are constructor functions with some syntactic sugar. Therefore, any mock for an ES6 class must be a function or an actual ES6 class (which is, again, another function). So you can mock them using [mock functions](MockFunctions.md).

In the Jest framework, there are three general approaches to mocking an import using `jest.mock()`.

1. Using a [manual mock](ManualMocks.md) that is implemented in the `__mocks__` folder.
2. Using a mock created by [`jest.mock()`](JestObjectAPI.md#jestmockmodulename-factory-options) and setting its implementation by calling [`mockImplementation()`](MockFunctionAPI.md#mockfnmockimplementationfn).
3. Passing a factory function ("module factory") as the [second parameter to `jest.mock()`](JestObjectAPI.md#jestmockmodulename-factory-options), where the factory function returns the mock*.

### * Module factory function must return a function
`jest.mock(path, moduleFactory)` expects a **module factory** argument. A module factory is a function that returns the mock.

In order to mock a constructor function, the module factory must return a constructor function. In other words, the module factory must be a function that returns a function - a higher-order function (HOF).

## An ES6 Class Example
We'll use a contrived example of a class that plays sound files, `SoundPlayer`, and a consumer class which uses that class, `SoundPlayerConsumer`. We'll mock `SoundPlayer` in our tests for `SoundPlayerConsumer`.

```javascript
// sound-player.js
export default class SoundPlayer {
  constructor() {
    this.foo = 'bar';
  }

  playSoundFile(fileName) {
    console.log('Playing sound file ' + fileName);
  }
}
```

```javascript
// sound-player-consumer.js
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

## Simple mocks that replace the class implementation
Using `jest.fn().mockImplementation()` can make it harder to read what the code is doing. This section shows how you can create your own simple mocks to help you understand the process.

### Manual mock that is another ES6 class
If you define an ES6 class using the same filename as the mocked class in the \__mocks\__ folder, it will serve as the mock. This class will be used in place of the real class. This allows you to inject a test implementation for the class, but does not provide a way to spy on calls.

For the contrived example, the mock might look like this:

```javascript
// sound-player.js
export default class SoundPlayer {
  constructor() {
    console.log('Mock SoundPlayer: constructor was called');
  }

  playSoundFile() {
    console.log('Mock SoundPlayer: playSoundFile was called');
  }
}
```

### Simple mock you can call `new` on:
The module factory function passed to `jest.mock(path, moduleFactory)` or `mockImplementation()` can be a HOF that returns a function. This will allow calling `new` on the mock. Again, this allows you to inject different behavior for testing, but does not provide a way to spy on calls.

```javascript
jest.mock('./sound-player', () => {
  return function() {
    return { playSoundFile: () => {} };
  };
});
```

***Note: Arrow functions won't work***

Note that the mock can't be an arrow function because calling `new` on an arrow function is not allowed in Javascript. So this won't work:

```javascript
jest.mock('./sound-player', () => {
  return () => { // Does not work; arrow functions can't be called with new
    return { playSoundFile: () => {} };
  };
});
```

This will throw ***TypeError: _soundPlayer2.default is not a constructor***, unless the code is transpiled to ES5, e.g. by babel-preset-env. (ES5 doesn't have arrow functions nor classes, so both will be transpiled to plain functions.)

## Keeping track of usage (spying on the mock)
Injecting a test implementation is helpful, but you will probably also want to test whether the class constructor and methods are called with the correct parameters.

### Spying on the constructor

In order to track calls to the constructor, replace the function returned by the HOF with a Jest mock function. Create it with [`jest.fn()`](JestObjectAPI.md#jestfnimplementation), and then specify its implementation with `mockImplementation()`.

```javascript
import SoundPlayer from './sound-player';
jest.mock('./sound-player', () => {
  return jest.fn().mockImplementation(() => { // Works and lets you check for constructor calls
    return { playSoundFile: () => {} };
  });
});
```

This will let us inspect usage of our mocked class, using `SoundPlayer.mock.calls`:
`expect(SoundPlayer).toHaveBeenCalled();`
or near-equivalent:
`expect(SoundPlayer.mock.calls.length).toEqual(1);`

### Spying on methods of our class
Our mocked class will need to provide any member functions (`playSoundFile` in the example) that will be called during our tests, or else we'll get an error for calling a function that doesn't exist. But we'll probably want to also spy on calls to those methods, to ensure that they were called with the expected parameters.

A new object will be created each time the mock constructor function is called during tests. To spy on method calls in all of these objects, we populate `playSoundFile` with another mock function, and store a reference to that same mock function in our test file, so it's available during tests.

```javascript
import SoundPlayer from './sound-player';
let mockPlaySoundFile = jest.fn();
jest.mock('./sound-player', () => {
  return jest.fn().mockImplementation(() => { // Works and lets us check for constructor calls
    return { playSoundFile: mockPlaySoundFile }; // Now we can track calls to playSoundFile
  });
});
```

The manual mock equivalent of this would be:
```javascript
// __mocks__/sound-player.js
export const mockPlaySoundFile = jest.fn(); // Import this named export into your test file
const mock = jest.fn().mockImplementation(() => {
  return { playSoundFile: mockPlaySoundFile }
});

export default mock;
```

Usage is identical, except that you don't need to pass a factory function to jest.mock(), and you must import the mocked method into your test file, since it is no longer defined there. Use the original module path for this; don't include `__mocks__`.

Note that, like all manual mocks, this will override the real implementation in all of your tests unless you call `jest.unmock('./sound-player)`.

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

```javascript
// sound-player-consumer.test.js
import SoundPlayerConsumer from './sound-player-consumer';
import SoundPlayer from './sound-player';

let mockPlaySoundFile = jest.fn();
jest.mock('./sound-player', () => {
  return jest.fn().mockImplementation(() => {
    return { playSoundFile: mockPlaySoundFile };
  });
});

beforeEach(() => {
  SoundPlayer.mockClear();
  mockPlaySoundFile.mockClear();
});

it('The consumer should be able to call new() on SoundPlayer', () => {
  const soundPlayerConsumer = new SoundPlayerConsumer();
  expect(soundPlayerConsumer).toBeTruthy(); // Constructor ran with no errors
});

it('We can check if the consumer called the class constructor', () => {
  const soundPlayerConsumer = new SoundPlayerConsumer();
  expect(SoundPlayer).toHaveBeenCalledTimes(1); // This would be 2 without mockClear
});

it('We can check if the consumer called a method on the class instance', () => {
  const soundPlayerConsumer = new SoundPlayerConsumer();
  const coolSoundFileName = 'song.mp3';
  soundPlayerConsumer.playSomethingCool();
  expect(mockPlaySoundFile.mock.calls[0][0]).toEqual(coolSoundFileName);
});

```
