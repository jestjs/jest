# pretty-format

> Stringify any JavaScript value.

- Supports all built-in JavaScript types
    * primitive types: `Boolean`, `null`, `Number`, `String`, `Symbol`, `undefined`
    * other non-collection types: `Date`, `Error`, `Function`, `RegExp`
    * collection types:
        * `arguments`, `Array`, `ArrayBuffer`, `DataView`, `Float32Array`, `Float64Array`, `Int8Array`, `Int16Array`, `Int32Array`, `Uint8Array`, `Uint8ClampedArray`, `Uint16Array`, `Uint32Array`,
        * `Map`, `Set`, `WeakMap`, `WeakSet`
        * `Object`
- [Blazingly fast](https://gist.github.com/thejameskyle/2b04ffe4941aafa8f970de077843a8fd)
    * similar performance to `JSON.stringify` in v8
    * significantly faster than `util.format` in Node.js
- Serialize application-specific data types with built-in or user-defined plugins

## Installation

```sh
$ yarn add pretty-format
```

## Usage

```js
const prettyFormat = require('pretty-format'); // CommonJS
```

```js
import prettyFormat from 'pretty-format'; // ES2015 modules
```

```js
const val = {object: {}};
val.circularReference = val;
val[Symbol('foo')] = 'foo';
val.map = new Map([['prop', 'value']]);
val.array = [-0, Infinity, NaN];

console.log(prettyFormat(val));
/*
Object {
  "array": Array [
    -0,
    Infinity,
    NaN,
  ],
  "circularReference": [Circular],
  "map": Map {
    "prop" => "value",
  },
  "object": Object {},
  Symbol(foo): "foo",
}
*/
```

## Usage with options

```js
function onClick() {}

console.log(prettyFormat(onClick));
/*
[Function onClick]
*/

const options = {
  printFunctionName: false,
};
console.log(prettyFormat(onClick, options));
/*
[Function]
*/
```

| key | type | default | description |
| :--- | :--- | :--- | :--- |
| `callToJSON` | `boolean` | `true` | call `toJSON` method (if it exists) on objects |
| `escapeRegex` | `boolean` | `false` | escape special characters in regular expressions |
| `highlight` | `boolean` | `false` | highlight syntax with colors in terminal (some plugins) |
| `indent` | `number` | `2` | spaces in each level of indentation |
| `maxDepth` | `number` | `Infinity` | levels to print in arrays, objects, elements, and so on |
| `min` | `boolean` | `false` | minimize added space: no indentation nor line breaks |
| `plugins` | `array` | `[]` | plugins to serialize application-specific data types |
| `printFunctionName` | `boolean` | `true` | include or omit the name of a function |
| `theme` | `object` | | colors to highlight syntax in terminal |

Property values of `theme` are from [ansi-styles colors](https://github.com/chalk/ansi-styles#colors)

```js
const DEFAULT_THEME = {
  comment: 'gray',
  content: 'reset',
  prop: 'yellow',
  tag: 'cyan',
  value: 'green',
};
```

## Usage with plugins

The `pretty-format` package provides some built-in plugins, including:

* `ReactElement` for elements from `react`
* `ReactTestComponent` for test objects from `react-test-renderer`

```js
// CommonJS
const prettyFormat = require('pretty-format');
const ReactElement = prettyFormat.plugins.ReactElement;
const ReactTestComponent = prettyFormat.plugins.ReactTestComponent;

const React = require('react');
const renderer = require('react-test-renderer');
```

```js
// ES2015 modules and destructuring assignment
import prettyFormat from 'pretty-format';
const {ReactElement, ReactTestComponent} = prettyFormat.plugins;

import React from 'react';
import renderer from 'react-test-renderer';
```

```js
const onClick = () => {};
const element = React.createElement('button', {onClick}, 'Hello World');

const formatted1 = prettyFormat(element, {
  plugins: [ReactElement],
  printFunctionName: false,
});
const formatted2 = prettyFormat(renderer.create(element).toJSON(), {
  plugins: [ReactTestComponent],
  printFunctionName: false,
});
/*
<button
  onClick=[Function]
>
  Hello World
</button>
*/
```

## Usage in Jest

For snapshot tests, Jest uses `pretty-format` with options that include some of it built-in plugins. For this purpose, plugins are also known as **snapshot serializers**.

To serialize application-specific data types, you can add modules to `devDependencies` of a project, and then:

In an **individual** test file, you can add a module as follows. It precedes any modules from Jest configuration.

```js
import serializer from 'my-serializer-module';
expect.addSnapshotSerializer(serializer);

// tests which have `expect(value).toMatchSnapshot()` assertions
```

For **all** test files, you can specify modules in Jest configuration. They precede built-in plugins for React, HTML, and Immutable.js data types. For example, in a `package.json` file:

```json
{
  "jest": {
    "snapshotSerializers": ["my-serializer-module"]
  }
}
```

### Plugins

Pretty format also supports adding plugins:

```js
const fooPlugin = {
  test(val) {
    return val && val.hasOwnProperty('foo');
  },
  print(val, print, indent) {
    return 'Foo: ' + print(val.foo);
  },
};

const obj = {foo: {bar: {}}};

prettyFormat(obj, {
  plugins: [fooPlugin],
});
// Foo: Object {
//   "bar": Object {}
// }
```
