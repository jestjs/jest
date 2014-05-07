---
id: dependency-injection
title: Dependency Injection
layout: docs
category: Deep Dive
permalink: dependency-injection.html
previous: timer-mocks
next: api
---

Dependency Injection was popularized in the JavaScript community by Angular.
Jest implements this design pattern as well but in a very different way.

What is Dependency Injection?
-----------------------------

In order to understand why we need to implement Dependency Injection in the context of testing, it is best to take a small example.

```javascript
function doWork() {
  var xhr = new XHR();
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
```

This class has a dependency on the XHR class. To get a reference to XHR, it uses the global namespace. If we want to test it by mocking XHR, we have to monkey patch the global namespace.

```javascript
var oldXHR = XHR;
XHR = function MockXHR() {};
doWork();
// assert that MockXHR got called with the right arguments
XHR = oldXHR; // if you forget this bad things will happen
```

We just implemented two important concepts

- **Service Locator**: how do I get a reference to XHR. Here, via the global object
- **Injection**: how do I give a different XHR in the case of a test. Here, via monkey patching the global object

This example is a valid implementation of Dependency Injection but isn't one we want to use as it modifies the global object.


How does Angular solve this problem?
------------------------------------

In Angular, you write your code by passing dependencies as arguments

```javascript
function doWork(XHR) {
  var xhr = new XHR();
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
```

Then it makes it very easy to write a test, you just pass your mocked version as argument to your function

```javascript
var MockXHR = function() {};
doWork(MockXHR);
// assert that MockXHR got called with the right arguments
```

Since it is annoying to have to pass around the dependencies every time you call a function, Angular provides a helper that does it automatically for you.

```
var injectedDoWork = injector.instantiate(doWork);

// is the equivalent of writing

function injectedDoWork() {
  var XHR = injector.get('XHR');
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
```

When you use the `injector` library of Angular, it's going to introspect your function and see that it takes an argument called `XHR` and rewrite it as a call to `injector.get('XHR')`


How does Jest solve this problem?
---------------------------------

If write a JavaScript program with node or using CommonJS, your code is going to look like

```
var XHR = require('XHR');
function doWork() {
  var xhr = new XHR();
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
```

What is interesting is that your code is already expressing dependencies via the `require` call. Jest monkey patches the `require` function in the test script.

```
jest.mock('XHR');
require('XHR'); // returns a mocked version of XHR

jest.dontMock('XHR');
require('XHR'); // returns the real XHR module
```

This way, you can write your test

```
jest.mock('XHR'); // note: this is done automatically
doWork();
var MockXHR = require('XHR');
// assert that MockXHR got called with the right arguments
```

Conclusion
----------

Both Jest and Angular are implementing Dependency Injection. The main difference is that Jest is using existing `require` calls in order to implement dependency injection. Angular is using function arguments which requires your code to be changed to be compatible with the pattern.

This means that if you have code using CommonJS `require`, you should be able to test your code using Jest without changing anything. If you have code written to be tested by Angular, you should also be able to use Jest in order to test your code.

