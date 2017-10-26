# Suggest using  `toBeDefined()` (prefer-to-be-defined)

In order to have a better failure message, `toBeDefined()` should be used upon asserting expections on defined value.

## Rule details

This rule triggers a warning if `toBe()` is used to assert a undefined value.

```js
expect(true).not.toBe(undefined);
```

This rule is enabled by default.

### Default configuration

The following patterns are considered warning:

```js
expect(true).not.toBe(undefined);
expect(true).not.toBeUndefined();
```

The following pattern is not warning:

```js
expect(true).toBeDefined();
```
