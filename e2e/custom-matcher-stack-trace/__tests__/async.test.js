expect.extend({toThrowCustomAsyncMatcherError});

test('showing the stack trace for an async matcher', async () => {
  await expect(true).toThrowCustomAsyncMatcherError();
});

async function toThrowCustomAsyncMatcherError() {
  const message = () =>
    'We expect the stack trace and code fence for this matcher to be shown in the console.';
  return {message, pass: false};
}
