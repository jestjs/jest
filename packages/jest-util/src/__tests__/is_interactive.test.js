let oldIsTTY;

beforeEach(() => {
  oldIsTTY = process.stdout.isTTY;
});

afterEach(() => {
  process.stdout.isTTY = oldIsTTY;
  jest.resetModules();
});

it('Returns true when running on interactive environment', () => {
  jest.doMock('is-ci', () => false);
  process.stdout.isTTY = true;

  const isInteractive = require('../is_interative').default;
  expect(isInteractive).toBe(true);
});

it('Returns false when running on a non-interactive environment', () => {
  let isInteractive;
  const expectedResult = false;

  // Test with is-ci being true and isTTY false
  jest.doMock('is-ci', () => true);
  process.stdout.isTTY = false;
  isInteractive = require('../is_interative').default;
  expect(isInteractive).toBe(expectedResult);

  // Test with is-ci being false and isTTY false
  jest.resetModules();
  jest.doMock('is-ci', () => false);
  process.stdout.isTTY = false;
  isInteractive = require('../is_interative').default;
  expect(isInteractive).toBe(expectedResult);

  // Test with is-ci being true and isTTY true
  jest.resetModules();
  jest.doMock('is-ci', () => true);
  process.stdout.isTTY = true;
  isInteractive = require('../is_interative').default;
  expect(isInteractive).toBe(expectedResult);
});
