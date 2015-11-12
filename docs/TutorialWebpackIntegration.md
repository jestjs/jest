---
id: tutorial-webpack-integration
title: Tutorial – Webpack Integration
layout: docs
category: Quick Start
permalink: docs/tutorial-webpack-integration.html
next: tutorial-jquery
---

Webpack integration may be achieved by installing the third-party [jest-webpack-alias](https://github.com/Ticketmaster/jest-webpack-alias) npm module. The preprocessor example below assumes that you're using ES6 features which require the `babel-jest` npm module, so we'll install that as well.

```sh
npm install --save-dev babel-jest
npm install --save-dev jest-webpack-alias
```

Next, you'll need to set up a preprocessor.

```javascript
// __tests__/preprocessor.js
var babelJest = require('babel-jest');
var webpackAlias = require('jest-webpack-alias');

module.exports = {
  process: function(src, filename) {
    if (filename.indexOf('node_modules') === -1) {
      src = babelJest.process(src, filename);
      src = webpackAlias.process(src, filename);
    }
    return src;
  }
};
```

Finally, you'll need to configure `package.json` to tell Jest where to find the preprocessor.

```
{
  ...
  "jest": {
    ...
    "scriptPreprocessor": "<rootDir>/__tests__/preprocessor.js",
  }
}
```

`jest-webpack-alias` can also support multiple Webpack profiles and alternate Webpack config files, so refer to [its README](https://github.com/Ticketmaster/jest-webpack-alias#packagejson-options) for further `package.json` options.
