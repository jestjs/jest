# jest-validate

Provides handy validation errors and warnings for given configuration object.

```
npm install --save-dev jest-validate
```

## Usage

```js
import {validate} from 'jest-validate';

validate(config: Object, validConfigSample: Object, deprecatedConfig: ?Object, options: ?Object);
```

## Customization

By default `jest-validate` will print errors and warnings specific to Jest. You can however customize this behavior by providing `options` object as a last argument:

```js
const options: ValidationOptions = {
  condition: (option: string, validOption: string): boolean,
  deprecate: (config: Object, option: string): void,
  error: (option: string, configOption: string, validConfigOption: string, options: ValidationOptions): void // throws ValidationError,
  footer: string,
  namespace: string,
  unknown: (config: Object, option: string, options: ValidationOptions),
}
```

## Examples
```js
validate(config, validConfigSample, deprecatedConfig, {namespace: 'Custom', footer: '\n\n  Documentation: http://custom-docs.com'});
```
Warning:

```
● Custom Validation Warning:

  Unknown option transformx with value "<rootDir>/node_modules/babel-jest" was found.
  This is either a typing error or a user mistake. Fixing it will remove this message.

  Documentation: http://custom-docs.com
```

Error:

```
● Custom Validation Error:

  Option transform must be of type:
    Object
  but instead received:
    String

  Example:
  {
    "transform": {"^.+\\.js$": "<rootDir>/preprocessor.js"}
  }

  Documentation: http://custom-docs.com
```

Deprecation (based on `deprecatedConfig` object with proper messages):

```
● Jest Deprecation Warning:

  Option scriptPreprocessor was replaced by transform, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    "transform": {".*": "xxx""}
  }

  Please update your configuration.

  Documentation: http://custom-docs.com
```
