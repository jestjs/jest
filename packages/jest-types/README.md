# @jest/types

This package contains shared types of Jest's packages.

If you are looking for types of [Jest globals](https://jestjs.io/docs/api), you can import them from `@jest/globals` package:

```ts
import { describe, it, expect } from '@jest/globals';

describe('my tests', () => {
  it('works', () => {
    expect(1).toBe(1);
  });
});
```

If you don't want to import types, you could install the [@types/jest](https://www.npmjs.com/package/@types/jest) package.
This is not maintained by the Jest team though.


See https://github.com/facebook/jest/issues/9972 for more info.
