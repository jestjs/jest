/**
 * @jest-environment jsdom
 */

import {fn} from 'fake-dual-dep2';

test('returns correct message', () => {
  expect(fn()).toBe('from browser');
});
