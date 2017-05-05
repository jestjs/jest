# Jest

[![CircleCI Build Status](https://circleci.com/gh/facebook/jest.svg?style=shield)](https://circleci.com/gh/facebook/jest)
[![Travis Build Status](https://travis-ci.org/facebook/jest.svg?branch=master)](https://travis-ci.org/facebook/jest) [![Windows Build Status](https://ci.appveyor.com/api/projects/status/8n38o44k585hhvhd/branch/master?svg=true)](https://ci.appveyor.com/project/Daniel15/jest/branch/master) [![npm version](https://badge.fury.io/js/jest.svg)](http://badge.fury.io/js/jest)

🃏 Painless JavaScript Testing

- **👩🏻‍💻 Easy Setup**: Jest is a complete and easy to set up JavaScript testing solution. In fact, Jest works out of the box for any React project.

- **🏃🏽 Instant Feedback**: Failed tests run first. Fast interactive mode can switch between running all tests or only test files related to changed files.

- **📸 Snapshot Testing**: Jest can [capture snapshots](http://facebook.github.io/jest/docs/snapshot-testing.html) of React trees or other serializable values to simplify UI testing.

## Getting Started

<generated_getting_started_start />
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

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

Finally, run `npm test` and Jest will print this message:

```
PASS  ./sum.test.js
✓ adds 1 + 2 to equal 3 (5ms)
```

**You just successfully wrote your first test using Jest!**

This test used `expect` and `toBe` to test that two values were exactly identical. To learn about the other things that Jest can test, see [Using Matchers](https://facebook.github.io/jest/docs/using-matchers.html).

## Running from command line

You can run Jest directly from the CLI (if it's globally available in your `PATH`, e.g. by `npm install -g jest`) with variety of useful options.

Here's how to run Jest on files matching `my-test`, using `config.json` as a configuration file and display a native OS notification after the run:

```bash
jest my-test --notify --config=config.json
```

If you'd like to learn more about running `jest` through the command line, take a look at the [Jest CLI Options](https://facebook.github.io/jest/docs/cli.html) page.

## Additional Configuration

### Using Babel

To use [Babel](http://babeljs.io/), install the `babel-jest` and `regenerator-runtime` packages:

```
npm install --save-dev babel-jest regenerator-runtime
```

*Note: Explicitly installing `regenerator-runtime` is not needed if you use `npm` 3 or 4 or Yarn*

Don't forget to add a [`.babelrc`](https://babeljs.io/docs/usage/babelrc/) file in your project's root folder. For example, if you are using ES6 and [React.js](https://facebook.github.io/react/) with the [`babel-preset-es2015`](https://babeljs.io/docs/plugins/preset-es2015/) and [`babel-preset-react`](https://babeljs.io/docs/plugins/preset-react/) presets:

```json
{
  "presets": ["es2015", "react"]
}
```

You are now set up to use all ES6 features and React specific syntax.

> Note: If you are using a more complicated Babel configuration, using Babel's `env` option,
keep in mind that Jest will automatically define `NODE_ENV` as `test`.
It will not use `development` section like Babel does by default when no `NODE_ENV` is set.

> Note: `babel-jest` is automatically installed when installing Jest and will automatically transform files if a babel configuration exists in your project. To avoid this behavior, you can explicitly reset the `transform` configuration option:

```json
// package.json
{
  "jest": {
    "transform": {}
  }
}
```

### Using webpack

Jest can be used in projects that use [webpack](https://webpack.github.io/) to manage assets, styles, and compilation. webpack does offer some unique challenges over other tools. Refer to the [webpack guide](https://facebook.github.io/jest/docs/webpack.html) to get started.

### Using TypeScript

To use TypeScript in your tests, install the `ts-jest` package and the types for Jest.

```
npm install --save-dev ts-jest @types/jest
```

then modify your `package.json` so the `jest` section looks something like:

```json
{
  "jest": {
    "transform": {
      "^.+\\.tsx?$": "<rootDir>/node_modules/ts-jest/preprocessor.js"
    },
    "testRegex": "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
    "moduleFileExtensions": [
      "ts",
      "tsx",
      "js",
      "json"
    ]
  }
}
```
<generated_getting_started_end />

## Documentation

Learn more about using Jest at http://facebook.github.io/jest

* [Getting Started](http://facebook.github.io/jest/docs/getting-started.html)
* [Guides](http://facebook.github.io/jest/docs/snapshot-testing.html)
* [API Reference](http://facebook.github.io/jest/docs/api.html)
* [Configuring package.json](http://facebook.github.io/jest/docs/configuration.html)

## Contributing

Send issues and pull requests with your ideas. For more information about contributing PRs and issues, see our [Contribution Guidelines](https://github.com/facebook/jest/blob/master/CONTRIBUTING.md).

[Good First Task](https://github.com/facebook/jest/labels/Good%20First%20Task) is a great starting point for PRs.
