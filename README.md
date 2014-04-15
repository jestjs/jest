# jest

jest is a JavaScript testing library + CLI.

Its goal is to make writing JavaScript unit tests as easy and frictionless as possible while running the tests as fast as possible.

## Getting Started

Getting started with jest is pretty simple. All you need to do is:

* Write some tests in a `__tests__` directory (jest ships with jasmine out-of-the-box)
* Add the following two things to your `package.json` and then run `npm test`:

```js
{
  ...
  "devDependencies": {
    "jest-cli": "*"
  },
  "scripts": {
    "test": "jest"
  }
  ...
}
```
