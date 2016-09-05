---
id: tutorial-webpack
title: Tutorial – webpack
layout: docs
category: Quick Start
permalink: docs/tutorial-webpack.html
next: tutorial-jquery
---

Jest can be used in projects that use webpack to manage assets, styles, and compilation.
webpack _does_ offers some unique challenges over other tools because it
integrates directly with your application to allow managing stylesheets,
assets like images and fonts, along with the expansive ecosystem of compile-to-JavaScript
languages and tools.

Let's start with a common sort of webpack config file and translate it to a Jest setup.

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
      "^.+\\.(gif|ttf|eot|svg)$": "<rootDir>/test/fileMock.js"
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

Alternatively, you can use an [ES2015 Proxy](https://github.com/keyanzhang/identity-obj-proxy)
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
// webpack provides via the file-loader
module.exports = '';
```

We've told Jest to ignore files matching a stylesheet or image extension, and instead,
require our mock files. You can adjust the regular expression to match the
file types your webpack config handles.

Now that Jest knows how to process our files, we need to tell it how to _find_ them.
For webpack's `moduleDirectories`, and `extensions` options there are direct analogs in Jest.

*Note: the `modulesDirectories` option in webpack is called `moduleDirectories` in Jest.*

*Note: <rootDir> is a special token that gets replaced by Jest with the root of your project. Most of the time this will be the folder where your package.json is located unless you specify a custom `rootDir` option in your configuration.*

```js
// package.json
{
  "jest": {
    "moduleFileExtensions": ["js", "jsx"],
    "moduleDirectories": ["node_modules", "bower_components", "shared"],

    "moduleNameMapper": {
      "^.+\\.(css|less)$": "<rootDir>/test/styleMock.js",    
      "^.+\\.(gif|ttf|eot|svg)$": "<rootDir>/test/fileMock.js"
    }
  }
}
```

Similarly webpack's `resolve.root` option functions like setting the `NODE_PATH`
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
      "^.+\\.(gif|ttf|eot|svg)$": "<rootDir>/test/fileMock.js"
    }
  }
}
```

And finally we just have the webpack `alias` left to handle. For that we can make use
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
      "^.+\\.(gif|ttf|eot|svg)$": "<rootDir>/test/fileMock.js"
    }
  }
}
```

That's it! webpack is a complex and flexible tool, so you may have to make some adjustments
to handle your specific application's needs. Luckily for most projects, Jest should be more than
flexible enough to handle your webpack config.

*Note: For more complex webpack configurations, you may also want to investigate
projects such as: [babel-plugin-webpack-loaders](https://github.com/istarkov/babel-plugin-webpack-loaders).*


## webpack 2

webpack 2 offers native support for ES modules. However, Jest runs in Node, and
thus requires ES modules to be transpiled to CommonJS modules. As such, if you
are using webpack 2, you most likely will want to configure Babel to transpile
ES modules to CommonJS modules only in the `test` environment.

```js
// .babelrc
{
  "presets": [
    ["es2015", {"modules": false}]
  ],

  "env": {
    "test": {
      "plugins": ["transform-es2015-modules-commonjs"]
    }
  }
}
```
