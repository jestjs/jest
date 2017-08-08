# pretty-format

> Stringify any JavaScript value.

- Supports [all built-in JavaScript types](#type-support)
- [Blazingly fast](https://gist.github.com/thejameskyle/2b04ffe4941aafa8f970de077843a8fd) (similar performance to v8's `JSON.stringify` and significantly faster than Node's `util.format`)
- Plugin system for extending with custom types (i.e. [`ReactTestComponent`](#reacttestcomponent-plugin))


## Installation

```sh
$ yarn add pretty-format
```

## Usage

```js
const prettyFormat = require('pretty-format'); // Common JS
```

```js
import prettyFormat from 'pretty-format'; // ES 2015 modules
```

```js
const val = {object: {}};
val.circularReference = val;
val[Symbol('foo')] = 'foo';
val.map = new Map([['prop', 'value']]);
val.array = [1, NaN, Infinity];

console.log(prettyFormat(val));
/*
Object {
  "array": Array [
    1,
    NaN,
    Infinity,
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

#### Type Support

`Object`, `Array`, `ArrayBuffer`, `DataView`, `Float32Array`, `Float64Array`, `Int8Array`, `Int16Array`, `Int32Array`, `Uint8Array`, `Uint8ClampedArray`, `Uint16Array`, `Uint32Array`, `arguments`, `Boolean`, `Date`, `Error`, `Function`, `Infinity`, `Map`, `NaN`, `null`, `Number`, `RegExp`, `Set`, `String`, `Symbol`, `undefined`, `WeakMap`, `WeakSet`

### API

```js
console.log(prettyFormat(val, options));
```

| key | type | default | description |
| --- | --- | --- | --- |
| `callToJSON` | `boolean` | `true` | call `toJSON` method (if it exists) on objects |
| `escapeRegex` | `boolean` | `false` | escape special characters in regular expressions |
| `highlight` | `boolean` | `false` | highlight syntax with colors in terminal (for some plugins) |
| `indent` | `number` | `2` | spaces in each level of indentation |
| `maxDepth` | `number` | `Infinity` | levels to print in arrays, objects, elements, and so on |
| `min` | `boolean` | `false` | minimize added space: no indentation nor line breaks |
| `plugins` | `array` | `[]` | plugins to serialize application-specific data types |
| `printFunctionName` | `boolean` | `true` | include or omit the name of a function |
| `theme` | `object` | `{/* see below */}` | colors to highlight syntax in terminal (for some plugins) |

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

#### `ReactTestComponent` and `ReactElement` plugins

```js
const prettyFormat = require('pretty-format');
const reactTestPlugin = require('pretty-format').plugins.ReactTestComponent;
const reactElementPlugin = require('pretty-format').plugins.ReactElement;

const React = require('react');
const renderer = require('react-test-renderer');

const element = React.createElement('h1', null, 'Hello World');

prettyFormat(renderer.create(element).toJSON(), {
  plugins: [reactTestPlugin, reactElementPlugin],
});
// <h1>
//   Hello World
// </h1>
```
