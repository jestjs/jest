# jest-diff

Display differences clearly so people can review changes confidently.

The default export serializes JavaScript **values** and compares them line-by-line.

Two named exports compare **strings** character-by-character:

- `diffStringsUnified` returns a string which includes comparison lines.
- `diffStringsUnaligned` returns an array of 2 strings.

## Installation

To add this package as a dependency of a project, run either of the following commands:

- `npm install jest-diff`
- `yarn add jest-diff`

## Usage of default export

Given values and optional options, `diffLinesUnified(a, b, options?)` does the following:

- **serialize** the values as strings using the `pretty-format` package
- **compare** the strings line-by-line using the `diff-sequences` package
- **format** the changed or common lines using the `chalk` package

To use this function, write either of the following:

- `const diffLinesUnified = require('jest-diff');` in a CommonJS module
- `import diffLinesUnified from 'jest-diff';` in an ECMAScript module

### Example of default export

```js
const a = ['delete', 'change from', 'common'];
const b = ['change to', 'insert', 'common'];

const difference = diffLinesUnified(a, b);
```

The returned **string** consists of:

- annotation lines which describe the change symbols with labels
- blank line
- comparison lines: similar to “unified” view on GitHub, but `Expected` lines are green, `Received` lines are red, and common lines are dim (by default, see Options)

```diff
- Expected
+ Received

  Array [
-   "delete",
-   "change from",
+   "change to",
+   "insert",
    "common",
  ]
```

### Edge cases of default export

Here are edge cases for the return value:

- `' Comparing two different types of values. …'` if the arguments have **different types** according to the `jest-get-type` package (instances of different classes have the same `'object'` type)
- `'Compared values have no visual difference.'` if the arguments have either **referential identity** according to `Object.is` method or **same serialization** according to the `pretty-format` package
- `null` if either argument is a so-called **asymmetric matcher** in Jasmine or Jest

## Usage of diffStringsUnified

Given strings and optional options, `diffStringsUnified(a, b, options?)` does the following:

- **compare** the strings character-by-character using the `diff-sequences` package
- **clean up** small (often coincidental) common substrings, known as “chaff”
- **format** the changed or common lines using the `chalk` package

Although the function is mainly for **multiline** strings, it compares any strings.

Write either of the following:

- `const {diffStringsUnified} = require('jest-diff');` in a CommonJS module
- `import {diffStringsUnified} from 'jest-diff';` in an ECMAScript module

### Example of diffStringsUnified

```js
const a = 'change from\ncommon';
const b = 'change to\ncommon';

const difference = diffStringsUnified(a, b);
```

The returned **string** consists of:

- annotation lines which describe the change symbols with labels
- blank line
- comparison lines: similar to “unified” view on GitHub, and **changed substrings** have **inverted** foreground and background colors

```diff
- Expected
+ Received

- change from
+ change to
  common
```

### Edge cases of diffStringsUnified

Here are edge cases for the return value:

- both `a` and `b` are empty strings: no comparison lines
- only `a` is empty string: all comparison lines have `bColor` and `bSymbol` (see Options)
- only `b` is empty string: all comparison lines have `aColor` and `aSymbol` (see Options)
- `a` and `b` are equal non-empty strings: all comparison lines have `commonColor` and `commonSymbol` (see Options)

### Performance of diffStringsUnified

To get the benefit of **changed substrings** within the comparison lines, a character-by-character comparison has a higher computational cost (in time and space) than a line-by-line comparison.

If the input strings can have **arbitrary length**, we recommend that the calling code set a limit, beyond which it calls the default export instead. For example, Jest falls back to line-by-line comparison if either string has length greater than 20K characters.

## Usage of diffStringsUnaligned

Given strings, `diffStringsUnaligned(a, b)` does the following:

- **compare** the strings character-by-character using the `diff-sequences` package
- **clean up** small (often coincidental) common substrings, known as “chaff”
- **format** the changed substrings using `inverse` from the `chalk` package

Although the function is mainly for **one-line** strings, it compares any strings.

Write either of the following:

- `const {diffStringsUnaligned} = require('jest-diff');` in a CommonJS module
- `import {diffStringsUnaligned} from 'jest-diff';` in an ECMAScript module

### Example of diffStringsUnaligned

```js
const [a, b] = diffStringsUnaligned('change from', 'change to');

// a === 'change ' + chalk.inverse('from')
// b === 'change ' + chalk.inverse('to')
```

The returned **array** of **two strings** corresponds to the two arguments.

Because the caller is responsible to format the returned strings, there are no options.

## Options

The default options are for the report when an assertion fails from the `expect` package used by Jest.

For other applications, you can provide an options object as a third argument:

- `diffLinesUnified(a, b, options)`
- `diffStringsUnified(a, b, options)`

### Properties of options object

| name           | default       |
| :------------- | :------------ |
| `aAnnotation`  | `'Expected'`  |
| `aColor`       | `chalk.green` |
| `aSymbol`      | `'-'`         |
| `bAnnotation`  | `'Received'`  |
| `bColor`       | `chalk.red`   |
| `bSymbol`      | `'+'`         |
| `commonColor`  | `chalk.dim`   |
| `commonSymbol` | `' '`         |
| `contextLines` | `5`           |
| `expand`       | `true`        |

### Example of options for labels

If the application is code modification, you might replace the labels:

```js
const options = {
  aAnnotation: 'Original',
  bAnnotation: 'Modified',
};
```

The `jest-diff` package does not assume that the 2 labels have equal length.

### Example of options for colors

For consistency with most diff tools, you might exchange the colors:

```js
import chalk from 'chalk';

const options = {
  aColor: chalk.red,
  bColor: chalk.green,
};
```

### Example of option to keep the default color

The value of a color option is a function, which given a string, returns a string.

For common lines to keep the default (usually black) color, you might provide an identity function:

```js
const options = {
  commonColor: line => line,
};
```

### Example of options for symbols

For consistency with the `diff` command, you might replace the symbols:

```js
const options = {
  aSymbol: '<',
  bSymbol: '>',
};
```

The `jest-diff` package assumes (but does not enforce) that the 3 symbols have equal length.

### Example of options to limit common lines

By default, the output includes all common lines.

To emphasize the changes, you might limit the number of common “context” lines:

```js
const options = {
  contextLines: 1,
  expand: false,
};
```

A patch mark like `@@ -12,7 +12,9 @@` accounts for omitted common lines.
