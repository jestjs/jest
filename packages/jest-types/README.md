# @jest/types

This package contains shared types of Jest's packages.

If you're a user of Jest and looking for types, you could import `@jest/globals`:

```typescript
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
