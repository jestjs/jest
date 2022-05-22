### `displayName` \[string, object]

Default: `undefined`

Allows for a label to be printed alongside a test while it is running. This becomes more useful in multi-project repositories where there can be many jest configuration files. This visually tells which project a test belongs to.

```js tab
/** @type {import('jest').Config} */
const config = {
  displayName: 'CLIENT',
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  displayName: 'CLIENT',
};

export default config;
```

Alternatively, an object with the properties `name` and `color` can be passed.

### `fakeTimers` \[object]

Default: `{}`

The fake timers may be useful when a piece of code sets a long timeout that we don't want to wait for in a test.

:::tip

Instead of including `jest.useFakeTimers()` in each test file, you can enable fake timers globally for all tests in your Jest configuration:

```js tab
/** @type {import('jest').Config} */
const config = {
  fakeTimers: {
    enableGlobally: true,
  },
};

module.exports = config;
```

```ts tab
import type {Config} from 'jest';

const config: Config = {
  fakeTimers: {
    enableGlobally: true,
  },
};

export default config;
```

:::

Configuration options:
