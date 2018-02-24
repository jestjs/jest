# Jest

[![CircleCI Build Status](https://circleci.com/gh/facebook/jest.svg?style=shield)](https://circleci.com/gh/facebook/jest)
[![Travis Build Status](https://travis-ci.org/facebook/jest.svg?branch=master)](https://travis-ci.org/facebook/jest)
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/8n38o44k585hhvhd/branch/master?svg=true)](https://ci.appveyor.com/project/Daniel15/jest/branch/master)
[![npm version](https://badge.fury.io/js/jest.svg)](http://badge.fury.io/js/jest)

🃏 Delightful JavaScript Testing

* **👩🏻‍💻 Easy Setup**: Complete and easy to set-up JavaScript testing solution.
  Works out of the box for any React project.

* **🏃🏽 Instant Feedback**: Fast interactive watch mode runs only test files
  related to changed files and is optimized to give signal quickly.

* **📸 Snapshot Testing**: Capture snapshots of React trees or other
  serializable values to simplify testing and to analyze how state changes over
  time.

## Getting Started

<!-- generated_getting_started_start -->

Install Jest using [`yarn`](https://yarnpkg.com/en/package/jest):

```bash
yarn add --dev jest
```

Or via [`npm`](https://www.npmjs.com/):

```bash
npm install --save-dev jest
```

The minimum supported Node version is `v6.0.0` by default. If you need to
support Node 4, refer to the
[Compatibility issues](https://facebook.github.io/jest/docs/en/troubleshooting.html#compatibility-issues)
section.

Let's get started by writing a test for a hypothetical function that adds two
numbers. First, create a `sum.js` file:

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

Finally, run `yarn test` and Jest will print this message:

```bash
PASS  ./sum.test.js
✓ adds 1 + 2 to equal 3 (5ms)
```

**You just successfully wrote your first test using Jest!**

This test used `expect` and `toBe` to test that two values were exactly
identical. To learn about the other things that Jest can test, see
[Using Matchers](https://facebook.github.io/jest/docs/using-matchers.html).

## Running from command line

You can run Jest directly from the CLI (if it's globally available in your
`PATH`, e.g. by `yarn global add jest`) with variety of useful options.

Here's how to run Jest on files matching `my-test`, using `config.json` as a
configuration file and display a native OS notification after the run:

```bash
jest my-test --notify --config=config.json
```

If you'd like to learn more about running `jest` through the command line, take
a look at the [Jest CLI Options](https://facebook.github.io/jest/docs/cli.html)
page.

## Additional Configuration

### Using Babel

[Babel](http://babeljs.io/) is automatically handled by Jest using `babel-jest`.
You don't need install anything extra for using Babel.

> Note: If you are using a babel version 7 then you need to install
> `babel-core@^7.0.0-0` and `@babel/core` with the following command:
>
> ```bash
> yarn add --dev 'babel-core@^7.0.0-0' @babel/core
> ```

Don't forget to add a [`.babelrc`](https://babeljs.io/docs/usage/babelrc/) file
in your project's root folder. For example, if you are using ES6 and
[React.js](https://facebook.github.io/react/) with the
[`babel-preset-env`](https://babeljs.io/docs/plugins/preset-env/) and
[`babel-preset-react`](https://babeljs.io/docs/plugins/preset-react/) presets:

```json
{
  "presets": ["env", "react"]
}
```

You are now set up to use all ES6 features and React specific syntax.

> Note: If you are using a more complicated Babel configuration, using Babel's
> `env` option, keep in mind that Jest will automatically define `NODE_ENV` as
> `test`. It will not use `development` section like Babel does by default when
> no `NODE_ENV` is set.

> Note: If you've turned off transpilation of ES modules with the option
> `{ "modules": false }`, you have to make sure to turn this on in your test
> environment.

```json
{
  "presets": [["env", {"modules": false}], "react"],
  "env": {
    "test": {
      "presets": [["env"], "react"]
    }
  }
}
```

> Note: `babel-jest` is automatically installed when installing Jest and will
> automatically transform files if a babel configuration exists in your project.
> To avoid this behavior, you can explicitly reset the `transform` configuration
> option:

```json
// package.json
{
  "jest": {
    "transform": {}
  }
}
```

### Using webpack

Jest can be used in projects that use [webpack](https://webpack.js.org/) to
manage assets, styles, and compilation. webpack does offer some unique
challenges over other tools. Refer to the [webpack guide](docs/Webpack.md) to
get started.

### Using TypeScript

To use TypeScript in your tests you can use
[ts-jest](https://github.com/kulshekhar/ts-jest).

<!-- generated_getting_started_end -->

## Documentation

Learn more about using
[Jest on the official site!](http://facebook.github.io/jest)

* [Getting Started](http://facebook.github.io/jest/docs/en/getting-started.html)
* [Guides](http://facebook.github.io/jest/docs/en/snapshot-testing.html)
* [API Reference](http://facebook.github.io/jest/docs/en/api.html)
* [Configuring Jest](http://facebook.github.io/jest/docs/en/configuration.html)

## Badge

Show the world you're using _Jest_ →
[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)
[![jest](https://facebook.github.io/jest/img/jest-badge.svg)](https://github.com/facebook/jest)

```md
[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)
[![jest](https://facebook.github.io/jest/img/jest-badge.svg)](https://github.com/facebook/jest)
```

## Contributing

Send issues and pull requests with your ideas. For more information about
contributing PRs and issues, see our
[Contribution Guidelines](https://github.com/facebook/jest/blob/master/CONTRIBUTING.md).

[Good First Issue](https://github.com/facebook/jest/labels/Good%20First%20Issue%20%3Awave%3A)
is a great starting point for PRs.
