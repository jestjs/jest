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
const prettyFormat = require('pretty-format');

var obj = { property: {} };
obj.circularReference = obj;
obj[Symbol('foo')] = 'foo';
obj.map = new Map();
obj.map.set('prop', 'value');
obj.array = [1, NaN, Infinity];

console.log(prettyFormat(obj));
```

**Result:**

```js
Object {
  "property": Object {},
  "circularReference": [Circular],
  "map": Map {
    "prop" => "value"
  },
  "array": Array [
    1,
    NaN,
    Infinity
  ],
  Symbol(foo): "foo"
}
```

#### Type Support

`Object`, `Array`, `ArrayBuffer`, `DataView`, `Float32Array`, `Float64Array`, `Int8Array`, `Int16Array`, `Int32Array`, `Uint8Array`, `Uint8ClampedArray`, `Uint16Array`, `Uint32Array`, `arguments`, `Boolean`, `Date`, `Error`, `Function`, `Infinity`, `Map`, `NaN`, `null`, `Number`, `RegExp`, `Set`, `String`, `Symbol`, `undefined`, `WeakMap`, `WeakSet`

### API

```js
console.log(prettyFormat(object));
console.log(prettyFormat(object, options));
```

Options:

* **`callToJSON`**<br>
  Type: `boolean`, default: `true`<br>
  Call `toJSON()` on passed object.
* **`indent`**<br>
  Type: `number`, default: `2`<br>
  Number of spaces for indentation.
* **`maxDepth`**<br>
  Type: `number`, default: `Infinity`<br>
  Print only this number of levels.
* **`min`**<br>
  Type: `boolean`, default: `false`<br>
  Print without whitespace.
* **`plugins`**<br>
  Type: `array`, default: `[]`<br>
  Plugins (see the next section).
* **`printFunctionName`**<br>
  Type: `boolean`, default: `true`<br>
  Print function names or just `[Function]`.
* **`escapeRegex`**<br>
  Type: `boolean`, default: `false`<br>
  Escape special characters in regular expressions.
* **`highlight`**<br>
  Type: `boolean`, default: `false`<br>
  Highlight syntax for terminal (works only with `ReactTestComponent` and `ReactElement` plugins.
* **`theme`**<br>
  Type: `object`, default: `{tag: 'cyan', content: 'reset'...}`<br>
  Syntax highlight theme.<br>
  Uses [ansi-styles colors](https://github.com/chalk/ansi-styles#colors) + `reset` for no color.<br>
  Available types: `tag`, `content`, `prop` and `value`.

### Plugins

Pretty format also supports adding plugins:

```js
const fooPlugin = {
  test(val) {
    return val && val.hasOwnProperty('foo');
  },
  print(val, print, indent) {
    return 'Foo: ' + print(val.foo);
  }
};

const obj = {foo: {bar: {}}};

prettyFormat(obj, {
  plugins: [fooPlugin]
});
// Foo: Object {
//   "bar": Object {}
// }
```

#### `ReactTestComponent` and `ReactElement` plugins

```js
const prettyFormat = require('pretty-format');
const reactTestPlugin = require('pretty-format/build/plugins/ReactTestComponent');
const reactElementPlugin = require('pretty-format/build/plugins/ReactElement');

const React = require('react');
const renderer = require('react-test-renderer');

const element = React.createElement('h1', null, 'Hello World');

prettyFormat(renderer.create(element).toJSON(), {
  plugins: [reactTestPlugin, reactElementPlugin]
});
// <h1>
//   Hello World
// </h1>
```
