# Disallow Disabled Tests (no-disabled-tests)

Jest has a feature that allows you to skip tests by appending `.skip` or prepending `x` to a test-suite or a test-case.
Sometimes tests are skipped as part of a debugging process and aren't intended to be committed. This rule reminds you to remove .skip or the x prefix from your tests.

## Rule Details

This rule looks for every `describe.skip`, `it.skip`, `test.skip`, `xdescribe`, `xit` and `xtest` occurrences within the source code.

The following patterns are considered warnings:

```js
describe.skip("foo", function () {});
it.skip("foo", function () {});
describe["skip"]("bar", function () {});
it["skip"]("bar", function () {});
test.skip("foo", function () {});
test["skip"]("bar", function () {});
xdescribe("foo", function () {});
xit("foo", function () {});
xtest("bar", function () {});
```

These patterns would not be considered warnings:

```js
describe("foo", function () {});
it("foo", function () {});
describe.only("bar", function () {});
it.only("bar", function () {});
test("foo", function () {});
test.only("bar", function () {});
```
