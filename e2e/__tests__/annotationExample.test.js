test.todo('work in progress example');

test('passing example', () => {
  expect(10).toBe(10);
});

test('passing snapshot example', () => {
  expect('some thing').toMatchSnapshot();
});

let i = 0;

jest.retryTimes(3, {logErrorsBeforeRetry: true});

test('retryTimes example', () => {
  i++;
  if (i === 3) {
    expect(true).toBeTruthy();
  } else {
    expect(true).toBeFalsy();
  }
});

test('failing snapshot example', () => {
  expect('nothing').toMatchSnapshot();
});

test.skip('skipped example', () => {
  expect(10).toBe(10);
});

test('failing example', () => {
  expect(10).toBe(1);
});

describe('nested', () => {
  test('failing example', () => {
    expect(abc).toBe(1);
  });
});
