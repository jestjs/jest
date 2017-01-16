# jest-validate

Generic configuration validation tool that helps you with warnings, errors and deprecation messages as well as showing users examples of correct configuration.

```
npm install --save-dev jest-validate
```

## Usage

```js
import {validate} from 'jest-validate';

validate(
  config: Object,
  options: ValidationOptions,
);
```

Where `ValidationOptions` are:
```js
export type ValidationOptions = {
  comment?: string,
  condition?: (option: any, validOption: any) => boolean,
  deprecate?: (
    config: Object,
    option: string,
    deprecatedOptions: Object,
    options: ValidationOptions
  ) => void,
  deprecatedConfig?: Object,
  error?: (
    option: string,
    received: any,
    defaultValue: any,
    options: ValidationOptions,
  ) => void,
  exampleConfig: Object,
  title?: Title,
  unknown?: (
    config: Object,
    option: string,
    options: ValidationOptions
  ) => void,
}
```
`exampleConfig` is the only option required.

## Customization

By default `jest-validate` will print generic warning and error messages. You can however customize this behavior by providing `options` object as a fourth argument:

```js
type ValidationOptions = {|
  condition?: (option: string, validOption: string): boolean,
  deprecate?: (config: Object, option: string): void,
  error?: (option: string, configOption: string, validConfigOption: string, options: ValidationOptions): void // throws ValidationError,
  comment?: string,
  title?: {|
    deprecation?: string,
    error?: string,
    warning?: string,
  |},
  unknown: (config: Object, option: string, options: ValidationOptions),
|}
```
Any of the options listed above can be overwritten to suite your needs.

## Example
```js
validate(config, {
  comment: '  Documentation: http://custom-docs.com',
  exampleConfig,
  deprecatedConfig,
  title: {
    deprecation: 'Custom Deprecation',
    // leaving 'error' and 'warning' as default
  }
});
```
Warning:

```
● Validation Warning:

  Unknown option transformx with value "<rootDir>/node_modules/babel-jest" was found.
  This is either a typing error or a user mistake. Fixing it will remove this message.

  Documentation: http://custom-docs.com
```

Error:

```
● Validation Error:

  Option transform must be of type:
    object
  but instead received:
    string

  Example:
  {
    "transform": {"^.+\\.js$": "<rootDir>/preprocessor.js"}
  }

  Documentation: http://custom-docs.com
```

Deprecation (based on `deprecatedConfig` object with proper deprecation messages):

```
Custom Deprecation:

  Option scriptPreprocessor was replaced by transform, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    "transform": {".*": "xxx"}
  }

  Please update your configuration.

  Documentation: http://custom-docs.com
```
