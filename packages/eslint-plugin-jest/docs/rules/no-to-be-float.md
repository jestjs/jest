# Disallow using  `toBe()` or `toEqual()` against Floats (no-to-be-float)

Avoid rounding error for using toBe() on float values

## Rule details

This rule triggers an error if `toBe()` or `toEqual()` is used to assert a float value.

```js
expect(0.3).toBe(0.3);
expect(0.3).toEqual(0.3);
```

This rule is enabled by default.

### Default configuration

The following patterns are considered error:

```js
expect(0.3).toBe(0.3);
expect(0.3).toEqual(0.3);
```

The following pattern is not error:

```js
expect(0.3).toBeCloseTo(0.3);
```
