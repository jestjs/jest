---
id: tutorial-async
title: Tutorial – Async
layout: docs
category: Quick Start
permalink: docs/tutorial-async.html
next: tutorial-jquery
---

*Note: make sure to install `babel-jest` and the async/await feature for this
tutorial. You can follow the [Getting Started](/jest/docs/getting-started.html)
guide.*

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
__mocks__/request.js
const users = {
  4: {name: 'Mark'},
  5: {name: 'Paul'},
};

export default function request(url) {
  return new Promise((resolve, reject) => {
    const userID = parseInt(url.substr('/users/'.length), 10);
    process.nextTick(
      () => users[userID] ? resolve(users[userID]) : reject({error: userID})
    );
  });
}
```

Now let's write a test for our async functionality. Jest provides the `pit`
wrapper to test Promise based code or async/await:
```js
// __tests__/user-test.js
jest.unmock('../user');

import * as user from '../user';

describe('async tests', () => {
  // Use `pit` instead of `it` for testing promises.
  // The promise that is being tested should be returned.
  pit('works with promises', () => {
    return user.getUserName(5)
      .then(name => expect(name).toEqual('Paul'));
  });
});
```

`pit` expects the return value to be a Promise that is going to be resolved.
You can chain as many Promises as you like and call `expect` at any time, as
long as you return a Promise at the end.

### `async`/`await`

Writing tests using the `async`/`await` syntax is easy with `pit`. Here is
how you'd write the same example from before:

```js
  pit('works with async/await', async () => {
    const userName = await user.getUserName(4);
    expect(userName).toEqual('Mark');
  });
```

To enable async/await in your project, install
[`babel-plugin-transform-async-to-generator`](http://babeljs.io/docs/plugins/transform-async-to-generator/) or
[`babel-preset-stage-3`](http://babeljs.io/docs/plugins/preset-stage-3/)
and enable the feature in your `.babelrc` file.

The code for this example is available at
[examples/async](https://github.com/facebook/jest/tree/master/examples/async).

*Note: If you'd like to test timers, like `setTimeout`, take a look at the
[Timer mocks](/jest/docs/timer-mocks.html) documentation.*
