let oldIsTTY;
let oldTERM;

beforeEach(() => {
  oldIsTTY = process.stdout.isTTY;
  oldTERM = process.env.TERM;
});

afterEach(() => {
  process.stdout.isTTY = oldIsTTY;
  process.env.TERM = oldTERM;
  jest.resetModules();
});

it('Returns true when running on interactive environment', () => {
  jest.doMock('is-ci', () => false);
  process.stdout.isTTY = true;
  process.env.TERM = 'xterm-256color';

  const isInteractive = require('../is_interative').default;
  expect(isInteractive).toBe(true);
});

it('Returns false when running on a non-interactive environment', () => {
  let isInteractive;
  const expectedResult = false;

  // Test with is-ci being true and isTTY false
  jest.doMock('is-ci', () => true);
  process.stdout.isTTY = false;
  process.env.TERM = 'xterm-256color';
  isInteractive = require('../is_interative').default;
  expect(isInteractive).toBe(expectedResult);

  // Test with is-ci being false and isTTY false
  jest.resetModules();
  jest.doMock('is-ci', () => false);
  process.stdout.isTTY = false;
  process.env.TERM = 'xterm-256color';
  isInteractive = require('../is_interative').default;
  expect(isInteractive).toBe(expectedResult);

  // Test with is-ci being true and isTTY true
  jest.resetModules();
  jest.doMock('is-ci', () => true);
  process.stdout.isTTY = true;
  process.env.TERM = 'xterm-256color';
  isInteractive = require('../is_interative').default;
  expect(isInteractive).toBe(expectedResult);

  // Test with dumb terminal
  jest.resetModules();
  jest.doMock('is-ci', () => false);
  process.stdout.isTTY = false;
  process.env.TERM = 'dumb';
  isInteractive = require('../is_interative').default;
  expect(isInteractive).toBe(expectedResult);
});
