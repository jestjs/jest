import {expect, it} from '@jest/globals';

it('throws unhandled error during test', async () => {
  setTimeout(() => {
    throw new Error('custom_unhandled_error');
  }, 10);
  await new Promise(resolve => setTimeout(resolve, 50));
  expect(true).toBe(true);
});
