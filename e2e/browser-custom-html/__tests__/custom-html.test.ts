import {expect, it} from '@jest/globals';

it('has custom HTML injected variable', () => {
  expect((globalThis as any).__CUSTOM_HTML_INJECTED__).toBe(true);
});

it('has document title from custom HTML', () => {
  expect(document.title).toBe('Custom Tester');
});
