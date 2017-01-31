---
id: tutorial-async
title: An Async Example
layout: docs
category: Guides
permalink: docs/tutorial-async.html
previous: tutorial-react-native
next: timer-mocks
---

First, enable Babel support in Jest as documented in the [Getting Started](/jest/docs/getting-started.html#using-babel) guide.

Let's implement a simple module that fetches user data from an API and
returns the user name.
```js
// user.js
import request from './request';

export function getUserName(userID) {
  return request('/users/' + userID).then(user => user.name);
}
```

In the above implementation we expect the `request.js` module to return a
promise. We chain a call to `then` to receive the user name.

Now imagine an implementation of `request.js` that goes to the network and
fetches some user data:

```js
// request.js
const http = require('http');

export default function request(url) {
  return new Promise(resolve => {
    // This is an example of an http request, for example to fetch
    // user data from an API.
    // This module is being mocked in __mocks__/request.js
    http.get({path: url}, response => {
      let data = '';
      response.on('data', _data => data += _data);
      response.on('end', () => resolve(data));
    });
  });
}
```

Because we don't want to go to the network in our test, we are going to create
a manual mock for our `request.js` module in the `__mocks__` folder.
It could look something like this:

```js
// __mocks__/request.js
const users = {
  4: {name: 'Mark'},
  5: {name: 'Paul'},
};

export default function request(url) {
  return new Promise((resolve, reject) => {
    const userID = parseInt(url.substr('/users/'.length), 10);
    process.nextTick(
      () => users[userID] ? resolve(users[userID]) : reject({
        error: 'User with ' + userID + ' not found.',
      })
    );
  });
}
```

Now let's write a test for our async functionality.
```js
// __tests__/user-test.js
jest.mock('../request');

import * as user from '../user';

// The promise that is being tested should be returned.
it('works with promises', () => {
  return user.getUserName(5)
    .then(name => expect(name).toEqual('Paul'));
});
```

We call `jest.mock('../request')` to tell Jest to use our manual mock. `it` expects the return value to be a Promise that is going to be resolved.
You can chain as many Promises as you like and call `expect` at any time, as
long as you return a Promise at the end.

### `async`/`await`

Writing tests using the `async`/`await` syntax is easy. Here is
how you'd write the same example from before:

```js
// async/await can also be used.
it('works with async/await', async () => {
  const userName = await user.getUserName(4);
  expect(userName).toEqual('Mark');
});
```

To enable async/await in your project, install
[`babel-plugin-transform-async-to-generator`](http://babeljs.io/docs/plugins/transform-async-to-generator/) or
[`babel-preset-stage-3`](http://babeljs.io/docs/plugins/preset-stage-3/)
and enable the feature in your `.babelrc` file.

### Error handling

Errors can be handled in the standard JavaScript way: Either using `.catch()`
directly on a Promise or through `try-catch` when using async/await. Note that
if a Promise throws and the error is not handled, the test will fail.

```js
// Testing for async errors can be done using `catch`.
it('tests error with promises', () => {
  return user.getUserName(3)
    .catch(e => expect(e).toEqual({
      error: 'User with 3 not found.',
    }));
});

// Or try-catch.
it('tests error with async/await', async () => {
  try {
    await user.getUserName(2);
  } catch (object) {
    expect(object.error).toEqual('User with 2 not found.');
  }
});
```

The code for this example is available at
[examples/async](https://github.com/facebook/jest/tree/master/examples/async).

If you'd like to test timers, like `setTimeout`, take a look at the
[Timer mocks](/jest/docs/timer-mocks.html) documentation.
