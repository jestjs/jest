---
id: tutorial-webpack
title: Tutorial – Webpack
layout: docs
category: Quick Start
permalink: docs/tutorial-webpack.html
next: tutorial-jquery
---

Jest can be used in projects that use Webpack to manage assets, styles, and compilation.
Webpack _does_ offers some unique challenges over other tools because it
integrates directly with your application to allow managing stylesheets,
assets like images and fonts, along with the expansive ecosystem of compile-to-JavaScript
languages and tools.

Let's start with a common sort of Webpack config file and translate it to a Jest setup.

```js
// webpack.config.js
{
  module: {
    loaders: [
      { test: /\\.jsx?$/, loader: 'babel', exclude: ['node_modules'] },
      { test: /\\.css$/,  loader: "style-loader!css-loader" },
      { test: /\\.gif$/, loader: "url-loader" },
      { test: /\\.(ttf|eot|svg)$/, loader: "file-loader" },
    ]
  },
  resolve: {
    extensions: ['', 'js', 'jsx'],
    moduleDirectories: ['node_modules', 'bower_components', 'shared']
    root: '/shared/vendor/modules',
    alias: {
      react: './vendor/react-master',
      config$: './configs/app-config.js',
    },
  }
}
```

Any JavaScript specific compilation (in this case via Babel) can be handled with the Jest
`scriptPreprocessor` option. If you are using `babel-jest`, this will work automatically.

Next let's configure Jest to gracefully handle asset files such as stylesheets and images.
Since these files aren't particularly useful in tests anyway we can safely mock them out.

```js
// package.json
{
  "jest": {
    "moduleNameMapper": {
      "^.+\\.(css|less)$": "<rootDir>/test/styleMock.js",    
      "^.+\\.(gif|ttf|eot|svg)$": "<rootDir>/test/fileMock.js",
    }
  }
}
```

And the mock file's themselves:

```js
// test/styleMock.js

// Return an object to emulate css modules (if you are using them)
module.exports = {};
```

Alternatively, you can use an [ES6 Proxy](https://github.com/keyanzhang/identity-obj-proxy)
(`npm install --save-dev identity-obj-proxy` or create your own) to mock [CSS Modules](https://github.com/css-modules/css-modules); then all your className
lookups on the styles object will be returned as-is (e.g., `styles.foobar === 'foobar'`).

Notice that Proxy is enabled in Node.js `v6.*` by default; if you are not on Node `v6.*` yet,
make sure you invoke Jest using `node --harmony_proxies node_modules/.bin/jest`.

```js
// test/styleMock.js

// Return a Proxy to emulate css modules (if you are using them)

var idObj = require('identity-obj-proxy');
module.exports = idObj;
```

```js
// test/fileMock.js

// Return an empty string or other mock path to emulate the url that
// Webpack provides via the file-loader
module.exports = '';
```

We've told Jest to ignore files matching a stylesheet or image extension, and instead,
require our mock files. You can adjust the regular expression to match the
file types your Webpack config handles.

Now that Jest knows how to process our files, we need to tell it how to _find_ them.
For Webpack's `moduleDirectories`, and `extensions` options there are direct analogs in Jest.

*Note: the `modulesDirectories` option in webpack is called `moduleDirectories` in Jest.*


```js
// package.json
{
  "jest": {
    "moduleFileExtensions": ["js", "jsx"],
    "moduleDirectories": ["node_modules", "bower_components", "shared"],

    "moduleNameMapper": {
      "^.+\\.(css|less)$": "<rootDir>/test/styleMock.js",    
      "^.+\\.(gif|ttf|eot|svg)$": "<rootDir>/test/fileMock.js",
    }
  }
}
```

Similarly Webpack's `resolve.root` option functions like setting the `NODE_PATH`
env variable, which you can set, or make use of the `modulePaths` option.

```js
// package.json
{
  "jest": {
    "modulePaths": [
      "/shared/vendor/modules"
    ],
    "moduleFileExtensions": ["js", "jsx"],
    "moduleDirectories": ["node_modules", "bower_components", "shared"],
    "moduleNameMapper": {
      "^.+\\.(css|less)$": "<rootDir>/test/styleMock.js",    
      "^.+\\.(gif|ttf|eot|svg)$": "<rootDir>/test/fileMock.js",
    }
  }
}
```

And finally we just have the Webpack `alias`s left to handle. For that we can make use
of the `moduleNameMapper` option again.

```js
// package.json
{
  "jest": {
    "modulePaths": [
      "/shared/vendor/modules"
    ],
    "moduleFileExtensions": ["js", "jsx"],
    "moduleDirectories": ["node_modules", "bower_components", "shared"],

    "moduleNameMapper": {
      "^react": "<rootDir>/vendor/react-master",
      "^config$": "<rootDir>/configs/app-config.js",

      "^.+\\.(css|less)$": "<rootDir>/test/styleMock.js",    
      "^.+\\.(gif|ttf|eot|svg)$": "<rootDir>/test/fileMock.js",
    }
  }
}
```

That's it! Webpack is a complex and flexible tool, so you may have to make some adjustments
to handle your specific application's needs. Luckily for most projects, Jest should be more than
flexible enough to handle your Webpack config.

*Note: For more complex Webpack configurations, you may also want to investigate
projects such as: [babel-plugin-webpack-loaders](https://github.com/istarkov/babel-plugin-webpack-loaders).*
