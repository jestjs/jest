# eslint-plugin-jest

Eslint plugin for Jest

## Installation

```
$ yarn install eslint eslint-plugin-jest --dev
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
    "jest/no-exclusive-tests": 2,
    "jest/no-identical-title": 2
  }
}
```

## Supported Rules

- [no-exclusive-tests](docs/rules/no-exclusive-tests.md) - disallow exclusive tests.
- [no-identical-title](docs/rules/no-identical-title.md) - disallow identical titles.


## Credit

* [eslint-plugin-mocha](https://github.com/lo1tuma/eslint-plugin-mocha)
* [eslint-plugin-jasmine](https://github.com/tlvince/eslint-plugin-jasmine)
