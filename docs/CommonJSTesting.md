---
id: common-js-testing
title: Module Testing
layout: docs
category: Core Concepts
permalink: docs/common-js-testing.html
next: automatic-mocking
---

Dependency Injection is a way to mock dependencies in order to make code
testable. In this article, we're going to see how Jest achieves the same result
using a different approach.

What is the problem?
--------------------

The [example](https://docs.angularjs.org/guide/unit-testing#dependency-injection)
that Angular documentation uses to justify Dependency Injection is the
following:

```javascript
function doWork() {
  const xhr = new XHR();
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
```

This function has a dependency on the `XHR` class and uses the global namespace
in order to get a reference to `XHR`. In order to mock this dependency, we have
to monkey patch the global object.

```javascript
let oldXHR = XHR;
XHR = function MockXHR() {};
doWork();
// assert that MockXHR got called with the right arguments
XHR = oldXHR; // if you forget this bad things will happen
```

This small example shows two important concepts. We need a way to get a
reference to `XHR` and a way to provide two implementations: one for the normal
execution and one for testing.

In this case, the solution to both concepts is to use the global object. It
works, but it's not ideal for reasons outlined in this article:
[Brittle Global State & Singletons](http://misko.hevery.com/code-reviewers-guide/flaw-brittle-global-state-singletons/).


How does Angular solve this problem?
------------------------------------

In Angular, you write your code by passing dependencies as arguments:

```javascript
function doWork(XHR) {
  const xhr = new XHR();
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
```

It makes it very easy to write a test – you just pass your mocked version as
argument to your function:

```javascript
const MockXHR = function() {};
doWork(MockXHR);
// assert that MockXHR got called with the right arguments
```

But it's a pain to thread these constructor arguments throughout a real
application. So Angular uses an `injector` behind the scenes. This makes it
easy to create instances that automatically acquire their dependencies:

```
const injectedDoWork = injector.instantiate(doWork);

// is the equivalent of writing

function injectedDoWork() {
  const xhr = injector.get('XHR');
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
```

Angular inspects the function and sees that it has one argument called `XHR`.
It then provides the value `injector.get('XHR')` for the variable `XHR`.

In order to have a testable function in Angular, you must conform to this
specific pattern and pass it into Angular's DI framework before you can use it.


How does Jest solve this problem?
---------------------------------

Angular uses function arguments as a way to model dependencies and has to
implement its own module loader. Most large JavaScript applications already use
a module loader with the `require` function. In a CommonJS JavaScript app, the
example above would look more like this:

```
const XHR = require('XHR');
function doWork() {
  const xhr = new XHR();
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
```

The interesting aspect of this code is that the dependency on `XHR` is
marshalled by `require()`. The idea behind Jest is to use this as a seam for
inserting test doubles by implementing a special `require` in the testing
environment.

```
jest.mock('XHR');
require('XHR'); // returns a mocked version of XHR

jest.unmock('XHR');
require('XHR'); // returns the real XHR module
```

This allows you to write your tests like this:

```
jest.mock('XHR'); // note: by default, this is done automatically in Jest
doWork();
const MockXHR = require('XHR');
// assert that MockXHR got called with the right arguments
```

Conclusion
----------

Dependency Injection is a very powerful tool that lets you swap the
implementation of any module at any time. However, the vast majority of code
only deals with one implementation for production and one for testing. Jest is
designed to make this common case much simpler to test.

Jest allows for mocking dependencies in the same way that Angular does, but
instead of building a proprietary module loader, it uses CommonJS. This enables
you to test any existing code that already uses CommonJS without having to
heavily refactor it to make it compatible with a another module system such as
Angular's.

Fortunately, because Angular code has been designed for testing in any
environment, it is still possible to test Angular code using Jest.


