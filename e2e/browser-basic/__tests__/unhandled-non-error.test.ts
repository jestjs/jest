import {expect, it} from '@jest/globals';

it('throws non-error unhandled rejection', async () => {
  Promise.reject('string_rejection_value');
  await new Promise(resolve => setTimeout(resolve, 50));
  expect(true).toBe(true);
});
