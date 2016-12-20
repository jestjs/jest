---
id: tutorial-async
title: Tutorial – Async
layout: docs
category: Quick Start
permalink: docs/tutorial-async.html
next: tutorial-webpack
---

Because Jest integrates with Babel, you can write modules and tests that utilize generators and async/await. In this tutorial, we walk through the setup of a new async package, compiled with Babel and tested with Jest.


### Write async module code

First, imagine an implementation of `request.js` that goes to the network and
fetches some user data:

```js
// src/request.js
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

Next, let's implement a simple async module that fetches user data from an API and
returns the user name.

```js
// src/user.js
import request from './request';

export async function getUserName(userID) {
  const user = await request('/users/' + userID);
  return user.name;
}
```

In the above implementation we expect the `request.js` module to return a
promise. We use the `await` keyword to wait for the promise to resolve before continuing. Because `getUserName` is an async function (defined using the `async` keyword), it will actually return a promise that will resolve with the name when the return statement is reached.


### Compile the async module with Babel

To allow modules to use upcoming language features like async/await, we must compile the source into code that our runtimes can handle today. Time to configure Babel:

Start by requiring `babel-cli` from your `package.json` `devDependencies`. Then add a build script that instructs babel to compile the files from your `src` directory into `lib`:

```
npm install --save-dev babel-cli
```

```json
  "devDependencies": {
    "babel-cli": "*",
    ...
  },
  "scripts": {
    "build": "babel src --out-dir lib"
  },
  "main": "lib/user",
```

Next we should configure the `.babelrc` inside our project. This configuration transpiles all features of es2015, and compiles async functions into generators:

```json
{
  "presets": ["es2015"],
  "plugins": [
    "transform-async-to-generator",
    ["transform-runtime", { "regenerator": true, "polyfill": false }]
  ]
}
```

Based on our babel configuration, we need to install the plugins and presets necesessary to compile in `devDependencies`. Because we need the regenerator module at runtime to manage the lifecycle of our promises, we need to add `babel-runtime` to our `dependencies`.

```
npm install --save-dev babel-preset-es2015 babel-plugin-transform-async-to-generator babel-plugin-transform-runtime
npm install --save babel-runtime
```

Now we can run `npm build` from our project, and the source code will get transpiled into ES5 in `lib/`:

```
$ npm run build

> @ build /Users/evv/jest/examples/async
> babel src --out-dir lib

src/__mocks__/request.js -> lib/__mocks__/request.js
src/__tests__/user-test.js -> lib/__tests__/user-test.js
src/request.js -> lib/request.js
src/user.js -> lib/user.js
```


### Write async test and configure Jest

Now let's write a test for our module's functionality.

```js
// src/__tests__/user-test.js

import * as user from '../user';

// The promise that is being tested should be returned.
it('works with promises', () => {
  return user.getUserName(5)
    .then(name => expect(name).toEqual('Paul'));
});
```

You can chain as many Promises as you like and call `expect` at any time, as long as you return a Promise at the end. Or you can use the async/await syntax to achieve the same:

```js
// 'async' causes the function to transaprently return a promise
it('works with promises', async () => {
  const name = await user.getUserName(5);
  expect(name).toEqual('Paul');
});
```

We must install and configure Jest before we can run the test. In the `package.json`, we need the `jest-cli` test runner, and the `babel-jest` adaptor. We also configure Jest to look at the code inside `src`, so that it doesn't get confused by the compiled code inside the `lib` folder:

```
npm install --save-dev jest-cli babel-jest
```

This is our final `package.json`, complete with the `test` script and `jest` config object:

```json
{
  "dependencies": {
    "babel-runtime": "*"
  },
  "devDependencies": {
    "babel-cli": "*",
    "babel-jest": "*",
    "babel-plugin-transform-async-to-generator": "*",
    "babel-plugin-transform-runtime": "*",
    "babel-preset-es2015": "*",
    "jest-cli": "*"
  },
  "scripts": {
    "test": "jest",
    "build": "babel src --out-dir lib"
  },
  "main": "lib/user",
  "jest": {
    "rootDir": "src"
  }
}
```


### Test error handling

Errors can be handled in the standard JavaScript way: Either using `.catch()`
directly on a Promise or through `try-catch` when using async/await. If a Promise throws and the error is not handled, the test will fail.

```js
// src/__tests__/user-test.js

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

### Mock the request implementation

Because we don't want to go to the network in our test, we are going to create
a manual mock for our `request.js` module in the `__mocks__` folder.
It could look something like this:

```js
// src/__mocks__/request.js
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

Now, to use the manual mock, call `jest.mock` from within the test file. Be sure to call this before the mocked module is used. Because `user` depends on the mocked module, we need to call `jest.mock` before we import `user`.

```js
// src/__tests__/user-test.js

jest.mock('../request');

import * as user from '../user';
```

Now the test can run without actually hitting the network, which will dramatically improve the test's performance and reliability!


### Conclusion

Now our package can utilize async/await, export ES5 for older runtimes, and implement async tests and mocks.

The code for this example is available at
[examples/async](https://github.com/facebook/jest/tree/master/examples/async).

*Note: If you'd like to test timers, like `setTimeout`, take a look at the
[Timer mocks](/jest/docs/timer-mocks.html) documentation.*
