/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {step} from '../step';

test('resolves with the return value of a synchronous callback', async () => {
  await expect(step('do a thing', () => 42)).resolves.toBe(42);
});

test('resolves with the return value of an async callback', async () => {
  await expect(
    step('do a thing', async () => {
      await Promise.resolve();
      return 'done';
    }),
  ).resolves.toBe('done');
});

test('propagates a synchronous throw', async () => {
  await expect(
    step('do a thing', () => {
      throw new Error('boom');
    }),
  ).rejects.toThrow('step "do a thing": boom');
});

test('propagates a rejected promise', async () => {
  await expect(
    step('do a thing', () => Promise.reject(new Error('boom'))),
  ).rejects.toThrow('step "do a thing": boom');
});

test('prefixes the error message with the path of nested steps', async () => {
  await expect(
    step('outer', () =>
      step('inner', () => {
        throw new Error('boom');
      }),
    ),
  ).rejects.toThrow('step "outer > inner": boom');
});

test('only prefixes the error message once, with the full nested path', async () => {
  const caught = await step('outer', () =>
    step('inner', () => {
      throw new Error('boom');
    }),
  ).catch((error: Error) => error);

  expect(caught.message).toBe('step "outer > inner": boom');
});

test('keeps concurrently running sibling steps from mixing up their paths', async () => {
  const runAndCapture = (title: string, delay: number) =>
    step(title, async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      throw new Error('boom');
    }).catch((error: Error) => error.message);

  const [slowerMessage, fasterMessage] = await Promise.all([
    runAndCapture('slower step', 10),
    runAndCapture('faster step', 0),
  ]);

  expect(slowerMessage).toBe('step "slower step": boom');
  expect(fasterMessage).toBe('step "faster step": boom');
});

test('does not tag a non-Error value thrown from the callback', async () => {
  const nonError = 'boom';

  await expect(
    step('do a thing', () => {
      throw nonError;
    }),
  ).rejects.toBe(nonError);
});

test('rejects when the title is not a string', async () => {
  await expect(
    // @ts-expect-error: testing runtime errors here
    step(123, () => {}),
  ).rejects.toThrow('It must be a string naming the step.');
});

test('rejects when the callback is not a function', async () => {
  await expect(
    // @ts-expect-error: testing runtime errors here
    step('do a thing', 'not a function'),
  ).rejects.toThrow('It must be a callback function.');
});
