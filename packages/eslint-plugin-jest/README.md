# eslint-plugin-jest

Eslint plugin for Jest

## Installation

```
$ yarn add --dev eslint eslint-plugin-jest
```

**Note:** If you installed ESLint globally then you must also install `eslint-plugin-jest` globally.

## Usage

Add `jest` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": [
    "jest"
  ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
  }
}
```

You can also whitelist the environment variables provided by Jest by doing:

```json
{
  "env": {
    "jest/globals": true
  }
}
```

## Supported Rules

- [no-disabled-tests](docs/rules/no-disabled-tests.md) - disallow disabled tests.
- [no-focused-tests](docs/rules/no-focused-tests.md) - disallow focused tests.
- [no-identical-title](docs/rules/no-identical-title.md) - disallow identical titles.

## Shareable configurations

### Recommended

This plugin exports a recommended configuration that enforces good testing practices.

To enable this configuration use the `extends` property in your `.eslintrc` config file:

```js
{
  "extends": ["plugin:jest/recommended"]
}
```

See [ESLint documentation](http://eslint.org/docs/user-guide/configuring#extending-configuration-files) for more information about extending configuration files.

The rules enabled in this configuration are:

- [jest/no-disabled-tests](docs/rules/no-disabled-tests.md)
- [jest/no-focused-tests](docs/rules/no-focused-tests.md)
- [jest/no-identical-title](docs/rules/no-identical-title.md)

## Credit

* [eslint-plugin-mocha](https://github.com/lo1tuma/eslint-plugin-mocha)
* [eslint-plugin-jasmine](https://github.com/tlvince/eslint-plugin-jasmine)
