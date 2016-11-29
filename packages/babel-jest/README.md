# babel-jest

[Babel](https://github.com/babel/babel) [jest](https://github.com/facebook/jest) plugin

## Usage

If you are already using `jest-cli`, just add `babel-jest` and it will automatically compile JavaScript code using babel.

```
npm install --save-dev babel-jest
```

If you would like to write your own preprocessor, uninstall and delete babel-jest and set the [config.transform](http://facebook.github.io/jest/docs/configuration.html#transform-object-string-string) option to your preprocessor.

## Setup

*Note: this step is only required if you are using `babel-jest` with additional code preprocessors.*

To explicitly define `babel-jest` as a transformer for your JavaScript code, map *.js* files to the `babel-jest` module.

```json
"transform": {
  "^.+\\.js$": "<rootDir>/node_modules/babel-jest"
},
```
