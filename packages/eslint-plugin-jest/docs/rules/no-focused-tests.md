# Disallow Focused Tests (no-focused-tests)

Jest has a feature that allows you to focus tests by appending `.only` or prepending `f` to a test-suite or a test-case.
This feature is really helpful to debug a failing test, so you don’t have to execute all of your tests.
After you have fixed your test and before committing the changes you have to remove `.only` to ensure all tests are executed on your build system.

This rule reminds you to remove `.only` from your tests by raising a warning whenever you are using the exclusivity feature.

## Rule Details

This rule looks for every `describe.only`, `it.only`, `test.only`, `fdescribe`, `fit` and `ftest` occurrences within the source code.
Of course there are some edge-cases which can’t be detected by this rule e.g.:

```js
var describeOnly = describe.only;
describeOnly.apply(describe);
```

The following patterns are considered warnings:

```js
describe.only("foo", function () {});
it.only("foo", function () {});
describe["only"]("bar", function () {});
it["only"]("bar", function () {});
test.only("foo", function () {});
test["only"]("bar", function () {});
fdescribe("foo", function () {});
fit("foo", function () {});
ftest("bar", function () {});
```

These patterns would not be considered warnings:

```js
describe("foo", function () {});
it("foo", function () {});
describe.skip("bar", function () {});
it.skip("bar", function () {});
test("foo", function () {});
test.skip("bar", function () {});
```
