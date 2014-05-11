---
id: blog-post
title: Jest - Painless JavaScript Unit Testing
layout: docs
category: Blog Post
permalink: blog-post.html
---

Testing is a crucial part of making a large scale application but is usually seen as a chore and difficult thing to do. Jest attempts to make it painless via two major innovations.


## CommonJS Modules

In order to be able to test code, you need to have a way to have two implementation for your dependencies: one for production and one for testing. Most solutions to this problem involve major refactoring of the code. For example, Angular's implementation of Dependency Injection uses arguments to express dependencies.

```javascript
function doWork(XHR) {
  var xhr = new XHR();
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
```

When looking at our codebase, we realized that all the dependencies for our modules were already expressed via `require` call from CommonJS module system.

```javascript
var XHR = require('XHR');
function doWork() {
  var xhr = new XHR();
  xhr.open('POST', 'http://facebook.github.io/jest/');
  xhr.send();
}
```

The natural next step was to write a custom `require` function in the testing testing enviroment that is able to provide a different implementation.

The end result is that you are able to test any code that uses CommonJS without any big refactoring. CommonJS `require` is the standard in node.js and rapidly getting adoption.


## Automatic Mocking

In order to write an effective unit test, you want to be able to isolate a unit of code and test only that unit -- nothing else. Automated mocking solves the rather uninteresting (but common) task of writing boilerplate to generate mocks for the unit you are testing.

Let's take a look at a concrete example

```javascript
// CurrentUser.js
var userID = 0;
module.exports = {
  getID: function() {
    return userID;
  },
  setID: function(id) {
    userID = id;
  }
};

// login.js
var CurrentUser = require('./CurrentUser.js');
```

If we run `login.js` with node, Jest will not become involved at all and the program will execute as you'd normally expect. However, if you run a unit test for the `login.js` file, Jest takes over and modifies `require()` such that the code behaves in the following way:

```javascript
var CurrentUser = {
  getID: jest.genMockFunction(),
  setID: jest.genMockFunction()
};
```

With this setup, you cannot accidentally rely on the implementation details of `CurrentUser.js` when testing `login.js` because all of the calls to the `CurrentUser` module are mocked. Additionally, testing becomes easier in practice because you don't have to write any boilerplate in your tests to setup mock objects for the dependencies you don't want to test.


## Conclusion



Jest, like many things at Facebook, is the result of a couple engineers being frustrated by how painful it is to test and hacked on a better solution.
