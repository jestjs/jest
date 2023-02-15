import {isLocalhost} from '../utils';

afterEach(() => {
  jest.restoreAllMocks();
});

it('isLocalhost should detect localhost environment', () => {
  jest.replaceProperty(process, 'env', {HOSTNAME: 'localhost'});

  expect(isLocalhost()).toBe(true);
});

it('isLocalhost should detect non-localhost environment', () => {
  jest.replaceProperty(process, 'env', {HOSTNAME: 'example.com'});

  expect(isLocalhost()).toBe(false);
});
