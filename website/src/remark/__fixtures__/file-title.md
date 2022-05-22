`.mockImplementation()` can also be used to mock class constructors:

```js tab title="SomeClass.js"
module.exports = class SomeClass {
  method(a, b) {}
};
```

```ts tab title="SomeClass.ts"
export class SomeClass {
  method(a: string, b: string): void {}
}
```

### `mockFn.mockImplementationOnce(fn)`

Accepts a function that will be used as an implementation of the mock for one call to the mocked function. Can be chained so that multiple function calls produce different results.
