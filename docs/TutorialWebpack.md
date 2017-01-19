---
id: tutorial-webpack
title: Tutorial – webpack
layout: docs
category: Quick Start
permalink: docs/tutorial-webpack.html
next: tutorial-jquery
---

Jest can be used in projects that use webpack to manage assets, styles, and compilation.
webpack _does_ offer some unique challenges over other tools because it
integrates directly with your application to allow managing stylesheets,
assets like images and fonts, along with the expansive ecosystem of compile-to-JavaScript
languages and tools.

Let's start with a common sort of webpack config file and translate it to a Jest setup.

```js
// webpack.config.js
module.exports = {
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
    modulesDirectories: ['node_modules', 'bower_components', 'shared'],
    root: '/shared/vendor/modules',
    alias: {
      react: './vendor/react-master',
      config$: './configs/app-config.js',
    },
  }
}
```

For JavaScript files that are transformed by Babel, installing `babel-jest`
will teach Jest to pick up your `.babelrc` config automatically. Non-Babel
JavaScript transformations can be handled with Jest's
[`transform`](/jest/docs/configuration.html#transform-object-string-string) config option.

Next let's configure Jest to gracefully handle asset files such as stylesheets and images.
Usually these files aren't particularly useful in tests so we can safely mock them out.
However, if you are using CSS Modules then it's better to mock a proxy for your className lookups.

```js
// package.json
{
  "jest": {
    "moduleNameMapper": {
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
      "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js"
    }
  }
}
```

And the mock files themselves:

```js
// __mocks__/styleMock.js

module.exports = {};
```

```js
// __mocks__/fileMock.js

module.exports = 'test-file-stub';
```

For CSS Modules, you can use an [ES2015 Proxy](https://github.com/keyanzhang/identity-obj-proxy)
(`npm install --save-dev identity-obj-proxy`) to mock
[CSS Modules](https://github.com/css-modules/css-modules); then all your className
lookups on the styles object will be returned as-is (e.g., `styles.foobar === 'foobar'`).
This is pretty handy for React snapshot testing.

Notice that Proxy is enabled in Node.js `v6.*` by default; if you are not on Node `v6.*` yet,
make sure you invoke Jest using `node --harmony_proxies node_modules/.bin/jest`.

```js
// package.json (for CSS Modules)
{
  "jest": {
    "moduleNameMapper": {
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
      "\\.(css|less)$": "identity-obj-proxy"
    }
  }
}
```

If `moduleNameMapper` cannot fulfill your requirements, you can use Jest's
[`transform`](/jest/docs/configuration.html#transform-object-string-string)
config option to specify how assets are transformed. For example, a transformer that
returns the basename of a file
(such that `require('logo.jpg');` returns `'logo'`) can be written as:

```js
// fileTransformer.js
const path = require('path');

module.exports = {
  process(src, filename, config, options) {
    return 'module.exports = ' + JSON.stringify(path.basename(filename)) + ';';
  },
};
```

```js
// package.json (for custom transformers and CSS Modules)
{
  "jest": {
    "moduleNameMapper": {
      "\\.(css|less)$": "identity-obj-proxy"
    },
    "transform": {
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/fileTransformer.js"
    }
  }
}
```

We've told Jest to ignore files matching a stylesheet or image extension, and instead,
require our mock files. You can adjust the regular expression to match the
file types your webpack config handles.

Now that Jest knows how to process our files, we need to tell it how to _find_ them.
For webpack's `modulesDirectories`, and `extensions` options there are direct analogs in Jest.

*Note: if you are using babel-jest with additional code preprocessors you have to explicitly define babel-jest as a transformer for your JavaScript code:*

```
"transform": {
  "^.+\\.js$": "<rootDir>/node_modules/babel-jest"
},
```

*Note: the `modulesDirectories` option in webpack is called `moduleDirectories` in Jest.*

*Note: <rootDir> is a special token that gets replaced by Jest with the root of your project. Most of the time this will be the folder where your package.json is located unless you specify a custom `rootDir` option in your configuration.*

```js
// package.json
{
  "jest": {
    "moduleFileExtensions": ["js", "jsx"],
    "moduleDirectories": ["node_modules", "bower_components", "shared"],

    "moduleNameMapper": {
      "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js",    
      "\\.(gif|ttf|eot|svg)$": "<rootDir>/__mocks__/fileMock.js"
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
      "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js",    
      "\\.(gif|ttf|eot|svg)$": "<rootDir>/__mocks__/fileMock.js"
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
      "^react(.*)$": "<rootDir>/vendor/react-master$1",
      "^config$": "<rootDir>/configs/app-config.js",

      "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js",    
      "\\.(gif|ttf|eot|svg)$": "<rootDir>/__mocks__/fileMock.js"
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
