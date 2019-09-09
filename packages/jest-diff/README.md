# jest-diff

Display differences clearly so people can review changes confidently.

The default export serializes JavaScript **values** and compares them line-by-line.

Two named exports compare **strings** character-by-character:

- `diffStringsUnified` returns a string which includes comparison lines.
- `diffStringsRaw` returns an array of `Diff` objects.

## Installation

To add this package as a dependency of a project, run either of the following commands:

- `npm install jest-diff`
- `yarn add jest-diff`

## Usage of default export

Given values and optional options, `diffDefault(a, b, options?)` does the following:

- **serialize** the values as strings using the `pretty-format` package
- **compare** the strings line-by-line using the `diff-sequences` package
- **format** the changed or common lines using the `chalk` package

To use this function, write either of the following:

- `const diffDefault = require('jest-diff').default;` in CommonJS modules
- `import diffDefault from 'jest-diff';` in ECMAScript modules

### Example of default export

```js
const a = ['delete', 'changed from', 'common'];
const b = ['changed to', 'insert', 'common'];

const difference = diffDefault(a, b);
```

The returned **string** consists of:

- annotation lines: describe the two change indicators with labels, and a blank line
- comparison lines: similar to “unified” view on GitHub, but `Expected` lines are green, `Received` lines are red, and common lines are dim (by default, see Options)

```diff
- Expected
+ Received

  Array [
-   "delete",
-   "changed from",
+   "changed to",
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
- **clean up** small (often coincidental) common substrings, also known as chaff
- **format** the changed or common lines using the `chalk` package

Although the function is mainly for **multiline** strings, it compares any strings.

Write either of the following:

- `const {diffStringsUnified} = require('jest-diff');` in CommonJS modules
- `import {diffStringsUnified} from 'jest-diff';` in ECMAScript modules

### Example of diffStringsUnified

```js
const a = 'changed from\ncommon';
const b = 'changed to\ncommon';

const difference = diffStringsUnified(a, b);
```

The returned **string** consists of:

- annotation lines: describe the two change indicators with labels, and a blank line
- comparison lines: similar to “unified” view on GitHub, and **changed substrings** have **inverse** foreground and background colors (which the following example does not show)

```diff
- Expected
+ Received

- changed from
+ changed to
  common
```

### Edge cases of diffStringsUnified

Here are edge cases for the return value:

- both `a` and `b` are empty strings: no comparison lines
- only `a` is empty string: all comparison lines have `bColor` and `bIndicator` (see Options)
- only `b` is empty string: all comparison lines have `aColor` and `aIndicator` (see Options)
- `a` and `b` are equal non-empty strings: all comparison lines have `commonColor` and `commonIndicator` (see Options)

### Performance of diffStringsUnified

To get the benefit of **changed substrings** within the comparison lines, a character-by-character comparison has a higher computational cost (in time and space) than a line-by-line comparison.

If the input strings can have **arbitrary length**, we recommend that the calling code set a limit, beyond which it calls the default export instead. For example, Jest falls back to line-by-line comparison if either string has length greater than 20K characters.

## Usage of diffStringsRaw

Given strings and boolean, `diffStringsRaw(a, b, cleanup)` does the following:

- **compare** the strings character-by-character using the `diff-sequences` package
- optionally **clean up** small (often coincidental) common substrings, also known as chaff

Write one of the following:

- `const {diffStringsRaw} = require('jest-diff');` in CommonJS modules
- `import {diffStringsRaw} from 'jest-diff';` in ECMAScript modules

Because `diffStringsRaw` returns the difference as **data** instead of a string, you can format it as your application requires (for example, enclosed in HTML markup for browser instead of escape sequences for console).

The returned **array** describes substrings as instances of the `Diff` class, which calling code can access like array tuples:

The value at index `0` is one of the following:

| value | named export  | description           |
| ----: | :------------ | :-------------------- |
|   `0` | `DIFF_EQUAL`  | in `a` and in `b`     |
|  `-1` | `DIFF_DELETE` | in `a` but not in `b` |
|   `1` | `DIFF_INSERT` | in `b` but not in `a` |

The value at index `1` is a substring of `a` or `b` or both.

### Example of diffStringsRaw with cleanup

```js
const diffs = diffStringsRaw('changed from', 'changed to', true);

/*
diffs[0][0] === 0 // DIFF_EQUAL
diffs[0][1] === 'changed '

diffs[1][0] === -1 // DIFF_DELETE
diffs[1][1] === 'from'

diffs[2][0] === 1 // DIFF_INSERT
diffs[2][1] === 'to'
*/
```

### Example of diffStringsRaw without cleanup

```js
const diffs = diffStringsRaw('changed from', 'changed to', false);

/*
diffs[0][0] === 0 // DIFF_EQUAL
diffs[0][1] === 'changed '

diffs[1][0] === -1 // DIFF_DELETE
diffs[1][1] === 'fr'

diffs[2][0] === 1 // DIFF_INSERT
diffs[2][1] === 't'

// Here is a small coincidental common substring:
diffs[3][0] === 0 // DIFF_EQUAL
diffs[3][1] === 'o'

diffs[4][0] === -1 // DIFF_DELETE
diffs[4][1] === 'm'
*/
```

### Advanced import for diffStringsRaw

Here are all the named imports for the `diffStringsRaw` function:

- `const {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, Diff, diffStringsRaw} = require('jest-diff');` in CommonJS modules
- `import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, Diff, diffStringsRaw} from 'jest-diff';` in ECMAScript modules

To write a **formatting** function, you might need the named constants (and `Diff` in TypeScript annotations).

If you write an application-specific **cleanup** algorithm, then you might need to call the `Diff` constructor:

```js
const diffCommon = new Diff(DIFF_EQUAL, 'changed ');
const diffDelete = new Diff(DIFF_DELETE, 'from');
const diffInsert = new Diff(DIFF_INSERT, 'to');
```

## Options

The default options are for the report when an assertion fails from the `expect` package used by Jest.

For other applications, you can provide an options object as a third argument:

- `diffDefault(a, b, options)`
- `diffStringsUnified(a, b, options)`

### Properties of options object

| name                     | default          |
| :----------------------- | :--------------- |
| `aAnnotation`            | `'Expected'`     |
| `aColor`                 | `chalk.green`    |
| `aIndicator`             | `'-'`            |
| `bAnnotation`            | `'Received'`     |
| `bColor`                 | `chalk.red`      |
| `bIndicator`             | `'+'`            |
| `changeColor`            | `chalk.inverse`  |
| `commonColor`            | `chalk.dim`      |
| `commonIndicator`        | `' '`            |
| `contextLines`           | `5`              |
| `expand`                 | `true`           |
| `includeChangeCounts`    | `false`          |
| `omitAnnotationLines`    | `false`          |
| `patchColor`             | `chalk.yellow`   |
| `trailingSpaceFormatter` | `chalk.bgYellow` |

For more information about the options, see the following examples.

### Example of options for labels

If the application is code modification, you might replace the labels:

```js
const options = {
  aAnnotation: 'Original',
  bAnnotation: 'Modified',
};
```

```diff
- Original
+ Modified

- changed from
+ changed to
  common
```

The `jest-diff` package does not assume that the 2 labels have equal length.

### Example of options for colors of changed lines

For consistency with most diff tools, you might exchange the colors:

```js
import chalk from 'chalk';

const options = {
  aColor: chalk.red,
  bColor: chalk.green,
};
```

### Example of option for color of changed substrings

Although the default inverse of foreground and background colors is hard to beat for changed substrings **within lines**, especially because it highlights spaces, if you want bold font weight on yellow background color:

```js
import chalk from 'chalk';

const options = {
  changeColor: chalk.bold.bgAnsi256(226), // #ffff00
};
```

### Example of option to format trailing spaces

Because the default export does not display substring differences within lines, formatting can help you see when lines differ by the presence or absence of trailing spaces found by `/\s+$/` regular expression.

The formatter is a function, which given a string, returns a string.

If instead of yellowish background color, you want to replace trailing spaces with middle dot characters:

```js
const options = {
  trailingSpaceFormatter: string => '·'.repeat(string.length),
};
```

### Example of options for no colors

The value of a color or formatter option is a function, which given a string, returns a string.

To store the difference in a file without escape codes for colors, provide an identity function:

```js
const noColor = string => string;

const options = {
  aColor: noColor,
  bColor: noColor,
  changeColor: noColor,
  commonColor: noColor,
  patchColor: noColor,
  trailingSpaceFormatter: noColor,
};
```

### Example of options for indicators

For consistency with the `diff` command, you might replace the indicators:

```js
const options = {
  aIndicator: '<',
  bIndicator: '>',
};
```

The `jest-diff` package assumes (but does not enforce) that the 3 indicators have equal length.

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

### Example of option for color of patch marks

If you want patch marks to have the same dim color as common lines:

```js
import chalk from 'chalk';

const options = {
  expand: false,
  patchColor: chalk.dim,
};
```

### Example of option to include change counts

To display the number of changed lines at the right of annotation lines:

```js
const a = ['changed from', 'common'];
const b = ['changed to', 'insert', 'common'];

const options = {
  includeChangeCounts: true,
};

const difference = diffDefault(a, b, options);
```

```diff
- Expected  1 -
+ Received  2 +

  Array [
-   "changed from",
+   "changed to",
+   "insert",
    "common",
  ]
```

### Example of option to omit annotation lines

To display only the comparison lines:

```js
const a = 'changed from\ncommon';
const b = 'changed to\ncommon';

const options = {
  omitAnnotationLines: true,
};

const difference = diffStringsUnified(a, b, options);
```

```diff
- changed from
+ changed to
  common
```
