import {expect, test} from '@jest/globals';
import {page} from '@jest/browser';

// Setup: extend page with custom method (normally done in a setup file)
(page as any).extend({greet: () => 'hello'});

test('page.extend adds custom method', () => {
  expect((page as any).greet()).toBe('hello');
});

test('page.elementLocator wraps element', () => {
  const div = document.createElement('div');
  div.textContent = 'test';
  document.body.append(div);
  const locator = page.elementLocator(div);
  expect(locator.element()).toBe(div);
});
