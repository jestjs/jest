---
id: auto-mocks
title: AutoMocks
layout: docs
category: Core Concepts
permalink: auto-mocks.html
previous: common-js-testing
next: mock-functions
---

In order to write an effective unit test, you want to test only the module and isolate it from its dependencies. Jest makes this best practice extremely easy by creating a mocked version of all the dependencies by default.

```javascript
jest.dontMock('MyModule');
```

This tells the test dependency system to load the real implementation of `MyModule` when it is imported using `require()`

The `jest` built-in object provides convenient features for building mock module implementations. The main features of the library are mock functions and special handling to make it easier to work with function prototypes.

Implementation
--------------

The test environment defines its own `require` function. As such, when you write
`require('MyModule')`, this function defers to jest's custom module loader on whether to return the actual implementation of `MyModule` or a mock for it. If the system decides to return a mock, it will first look for a file in a `__mocks__/` directory which defines the module. If no file is found, it will attempt to autogenerate a mock for the module.

Autogeneration is done as follows: the module is loaded in a new context. If the file can be evaluated, the mocking system recurses over the members of the module's `exports` and serializes it's type information. When a module that is being mocked requires another module, the system recursively generates a mock for it. If that file cannot be evaluated, an exception is thrown and the mock generation stack is printed.

Prototypes
----------

The mock system has special handling for function prototypes. Given a module that looks like this:

```javascript
function Poller(callback) {
  this.callback = callback;
}
Poller.prototype.setInterval = function(interval) {
  // set interval
};
```

We want the different instances to each have their own version of `setInterval`, so they can be tested independently. The mocks system handles this by copying prototype methods to the instance. This may be incompatible with some class definition strategies, but in this regard the test framework encourages delegation over inheritance.

```javascript
var Poller = require('Poller');
var poller1 = new Poller();
var poller2 = new Poller();
poller1.setInterval(1);
poller2.setInterval(2);

// poller1 and poller2 do NOT share setInterval slot
expect(poller1.setInterval.mock.calls.length)
  .not.toEqual(2);
```

