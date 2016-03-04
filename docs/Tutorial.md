---
id: tutorial
title: Tutorial
layout: docs
category: Quick Start
permalink: docs/tutorial.html
next: tutorial-react
---


To begin, let's see how we might test the following function (borrowed from [this great article on testing asynchronous functions](http://martinfowler.com/articles/asyncJS.html)). It does an Ajax request to get the current user as JSON, transforms this JSON into a new object, and passes it to the callback. Very typical code:

```javascript
// fetchCurrentUser.js
'use strict';

const $ = require('jquery');

function parseJSON(user) {
  return {
    loggedIn: true,
    fullName: user.firstName + ' ' + user.lastName,
  };
}

function fetchCurrentUser(callback) {
  return $.ajax({
    type: 'GET',
    url: 'http://example.com/currentUser',
    done: user => callback(parseJSON(user)),
  });
}

module.exports = fetchCurrentUser;
```

In order to write a test for this module, we need to create a `__tests__/`
directory where the file `fetchCurrentUser.js` is. In this folder, we create a
file called `fetchCurrentUser-test.js` and we write our test in it:

```javascript
// __tests__/fetchCurrentUser-test.js
'use strict';

jest.unmock('../fetchCurrentUser.js');

describe('fetchCurrentUser', () => {
  it('calls into $.ajax with the correct params', () => {
    const $ = require('jquery');
    const fetchCurrentUser = require('../fetchCurrentUser');

    // Call into the function we want to test
    const dummyCallback = () => {};
    fetchCurrentUser(dummyCallback);

    // Now make sure that $.ajax was properly called during the previous
    // 2 lines
    expect($.ajax).toBeCalledWith({
      type: 'GET',
      url: 'http://example.com/currentUser',
      success: jasmine.any(Function),
    });
  });
});
```

When Jest runs, it runs any tests found in `__tests__` directories within the
source tree.

The first line is very important: `jest.unmock('../fetchCurrentUser.js');`.
By default, Jest automatically makes all calls to `require()` return a mocked
version of the real module – so we need to tell Jest not to mock the file we
want to test or else `require('../fetchCurrentUser')` will return a mock.

In our first test, we want to confirm that calling `fetchCurrentUser()`
properly incurs a call into `$.ajax()` with the parameters we expect. To do
this, we just call `fetchCurrentUser()` with a dummy callback function, and
then simply inspect the `$.ajax` mock to verify that it was called with the
correct parameters.

Woohoo! We've written our first test. But we're not quite done: We would still
like to test that the callback we are passing in is indeed called back when the
`$.ajax` request has completed. To test this, we can do the following:

```javascript
  it('calls the callback when $.ajax requests are finished', () => {
    const $ = require('jquery');
    const fetchCurrentUser = require('../fetchCurrentUser');

    // Create a mock function for our callback
    const callback = jest.fn();
    fetchCurrentUser(callback);

    // Now we emulate the process by which `$.ajax` would execute its own
    // callback
    $.ajax.mock.calls[0/*first call*/][0/*first argument*/].success({
      firstName: 'Bobby',
      lastName: '");DROP TABLE Users;--',
    });

    // And finally we assert that this emulated call by `$.ajax` incurred a
    // call back into the mock function we provided as a callback
    expect(callback.mock.calls[0/*first call*/][0/*first arg*/]).toEqual({
      loggedIn: true,
      fullName: 'Bobby ");DROP TABLE Users;--',
    });
  });
```

In order for `fetchCurrentUser` to compute the result to be passed in to the
callback, `fetchCurrentUser` will call in to one of it's dependencies: `$.ajax`.
Since Jest has mocked this dependency for us, it's easy to inspect all of the
interactions with `$.ajax` that occurred during our test.

At this point, you might be wondering how Jest was able to decide what the mock
for the `jQuery` module should look like. The answer is simple: Jest secretly
requires the real module, inspects what it looks like, and then builds a mocked
version of what it saw. This is how Jest knew that there should be a `$.ajax`
property, and that that property should be a mock function.

In Jest, all mock functions have a `.mock` property that stores all the
interactions with the function. In the above case, we are reading from
`mock.calls`, which is an array that contains information about each time the
function was called, and what arguments each of those calls had.

Now it is time to see if it worked:

```
> npm test
[PASS] jest/examples/__tests__/fetchCurrentUser-test.js (0.075s)
```

Woohoo! That's it, we just tested this asynchronous function. One thing to
notice is that the code we've written is entirely synchronous. This is one of
the strengths of using mock functions in this way: the code you write in tests
is always straightfoward and imperative, no matter if the code being tested is
synchronous or asynchronous.

The code for this example is available at [examples/tutorial](https://github.com/facebook/jest/tree/master/examples/tutorial).
