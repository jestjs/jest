---
id: getting-started
title: Getting Started
layout: docs
category: Introduction
permalink: docs/getting-started.html
next: using-matchers
---

Install Jest using `npm`:

```
npm install --save-dev jest
```

Let's get started by writing a test for a hypothetical function that adds two numbers. First, create a `sum.js` file:

```javascript
function sum(a, b) {
  return a + b;
}
module.exports = sum;
```

Then, create a file named `sum.test.js`. This will contain our actual test:

```javascript
const sum = require('./sum');

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});
```

Add the following section to your `package.json`:

```js
"scripts": {
  "test": "jest"
}
```

Finally, run `npm test` and Jest will print this message:

```
PASS  ./sum.test.js
✓ adds 1 + 2 to equal 3 (5ms)
```

**You just successfully wrote your first test using Jest!**

This test used `expect` and `toBe` to test that two values were exactly identical. To learn about the other things that Jest can test, see [Using Matchers](/jest/docs/using-matchers.html).

## Additional Configuration

### Using Babel

To use [Babel](http://babeljs.io/), install the `babel-jest` and `babel-polyfill` packages:

```
npm install --save-dev babel-jest babel-polyfill
```

Don't forget to add a [`.babelrc`](https://babeljs.io/docs/usage/babelrc/) file in your project's root folder. For example, if you are using ES6 and [React.js](https://facebook.github.io/react/) with the [`babel-preset-es2015`](https://babeljs.io/docs/plugins/preset-es2015/) and [`babel-preset-react`](https://babeljs.io/docs/plugins/preset-react/) presets:

```js
{
  "presets": ["es2015", "react"]
}
```

You are now set up to use all ES6 features and React specific syntax.

> Note: If you are using a more complicated Babel configuration, using Babel's `env` option,
keep in mind that Jest will automatically define `NODE_ENV` as `test`.
It will not use `development` section like Babel does by default when no `NODE_ENV` is set.

### Using webpack

Jest can be used in projects that use [webpack](https://webpack.github.io/) to manage assets, styles, and compilation. webpack does offer some unique challenges over other tools. Refer to the [webpack guide](/jest/docs/webpack.html) to get started.

### Using TypeScript

To use TypeScript in your tests, install the `ts-jest` package:

```
npm install --save-dev test-jest
```

then modify your `package.json` so the `jest` section looks something like:

```json
{
  "jest": {
    "transform": {
      ".(ts|tsx)": "<rootDir>/node_modules/ts-jest/preprocessor.js"
    },
    "testRegex": "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
    "moduleFileExtensions": [
      "ts",
      "tsx",
      "js"
    ]
  }
}
```
