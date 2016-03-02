# babel-plugin-jest-unmock

Babel plugin to hoist `jest.unmock` calls above `import` statements. This plugin is automatically included when using [babel-jest](https://github.com/facebook/jest/tree/master/packages/babel-jest).

## Installation

```sh
$ npm install babel-plugin-jest-unmock
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["jest-unmock"]
}
```

### Via CLI

```sh
$ babel --plugins jest-unmock script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["jest-unmock"]
});
```
