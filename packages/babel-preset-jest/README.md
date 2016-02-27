# babel-preset-jest

> Babel preset for all Jest plugins.

## Install

```sh
$ npm install --save-dev babel-preset-jest
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "presets": ["jest"]
}
```

### Via CLI

```sh
$ babel script.js --presets jest
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  presets: ["jest"]
});
```
