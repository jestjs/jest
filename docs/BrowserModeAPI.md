---
id: browser-mode-api
title: Browser Mode API
---

:::caution

Jest ships with **experimental** support for Browser Mode. The implementation may have bugs and lack features.

:::

# Browser Mode API

Browser Mode provides `page`, `userEvent`, `commands`, and `server` for interacting with the browser from your tests.

```js
import {commands, page, server, userEvent} from '@jest/browser';
```

Test primitives (`describe`, `it`, `expect`, `jest`, etc.) are still imported from `@jest/globals`:

```js
import {describe, expect, it} from '@jest/globals';
```

## `page`

The `page` object provides browser page interactions and serves as the extension point for framework plugins.

### `page.screenshot(options?)`

Capture a screenshot of the current page:

```js
await page.screenshot();
await page.screenshot({save: true}); // persist to disk
```

### `page.extend(methods)`

Add custom methods to the `page` object. Used by framework plugins (e.g., `jest-browser-vue`, `jest-browser-react`) to add component rendering:

```js
import {page} from '@jest/browser';
import {beforeEach} from '@jest/globals';

const cleanup = () => {
  /* unmount components */
};

page.extend({
  render: (component, options) => {
    /* mount component to DOM, return result */
  },
  [Symbol.for('jest:component-cleanup')]: cleanup,
});

beforeEach(() => cleanup());
```

After extension, tests can use:

```js
const result = await page.render(MyComponent, {props: {name: 'Jest'}});
```

**Type augmentation** for TypeScript:

```ts
declare module '@jest/browser' {
  interface BrowserPage {
    render(component: Component, options?: MountOptions): Promise<RenderResult>;
  }
}
```

### `page.elementLocator(element)`

Wrap a DOM element with a locator API for automated interactions:

```js
const container = document.querySelector('#app');
const locator = page.elementLocator(container);

await locator.click();
const el = locator.element();
```

## `userEvent`

Simulates real user interactions via Playwright automation. Unlike `jsdom` event simulation, these actions go through the browser's native event pipeline.

### `userEvent.click(element)`

Click on an element:

```js
const button = document.querySelector('button');
await userEvent.click(button);
```

### `userEvent.dblClick(element)`

Double-click on an element:

```js
await userEvent.dblClick(element);
```

### `userEvent.type(element, text)`

Type text character by character (fires keydown/keypress/keyup per char):

```js
const input = document.querySelector('input');
await userEvent.type(input, 'Hello World');
```

### `userEvent.fill(element, text)`

Fill an input with text (faster than `type`, sets value directly):

```js
await userEvent.fill(input, 'instant value');
```

### `userEvent.clear(element)`

Clear an input's value:

```js
await userEvent.clear(input);
```

### `userEvent.hover(element)`

Hover over an element:

```js
await userEvent.hover(element);
```

### `userEvent.unhover(element)`

Move pointer away from an element:

```js
await userEvent.unhover(element);
```

### `userEvent.tab()`

Press the Tab key to move focus:

```js
await userEvent.tab();
```

### `userEvent.keyboard(text)`

Press keyboard keys using Playwright's keyboard syntax:

```js
await userEvent.keyboard('Enter');
await userEvent.keyboard('Control+A');
```

### `userEvent.selectOptions(element, values)`

Select options in a `<select>` element:

```js
const select = document.querySelector('select');
await userEvent.selectOptions(select, ['option1', 'option2']);
```

## `commands`

Custom commands that execute on the Node.js side via RPC. Useful for filesystem operations or other server-side tasks during tests.

### Built-in Commands

#### `commands.removeFile(path)`

Remove a file from the filesystem:

```js
await commands.removeFile('./tmp/output.txt');
```

### Custom Commands

Provider packages can register additional commands via `getCommands()`. These are dispatched through the `triggerCommand` RPC mechanism.

## `server`

Provides metadata about the current browser environment:

```js
import {server} from '@jest/browser';

console.log(server.browser); // 'chromium'
console.log(server.platform); // 'darwin'
```

## Complete Example

```js
import {page, userEvent} from '@jest/browser';
import {describe, expect, it} from '@jest/globals';

describe('login form', () => {
  it('submits credentials', async () => {
    document.body.innerHTML = `
      <form>
        <input id="email" type="email" />
        <input id="password" type="password" />
        <button type="submit">Login</button>
      </form>
    `;

    const email = document.querySelector('#email');
    const password = document.querySelector('#password');

    await userEvent.type(email, 'user@example.com');
    await userEvent.type(password, 'secret123');

    const button = document.querySelector('button');
    await userEvent.click(button);

    expect(email.value).toBe('user@example.com');
    expect(password.value).toBe('secret123');
  });
});
```

## How `userEvent` Works

Unlike `@testing-library/user-event` which dispatches synthetic events in JavaScript, Jest Browser Mode's `userEvent` sends commands via WebSocket (birpc) to the Node.js process, which then uses Playwright's native browser automation to perform the action. This means:

- Events follow the browser's real event pipeline (focus -> keydown -> input -> keyup -> change)
- Browser-level constraints are respected (disabled elements, visibility, etc.)
- The browser's rendering engine processes the interaction before returning
