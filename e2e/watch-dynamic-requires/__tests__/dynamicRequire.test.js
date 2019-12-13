test('loading a file with a dynamic local require should work', () => {
  const {withStandardResolution} = require('../dynamicRequire');
  expect(withStandardResolution()).toBe(1);
});

test('loading a file with a dynamic require and custom resolve should work', () => {
  const {withCustomResolution} = require('../dynamicRequire');
  expect(withCustomResolution()).toBe(1);
});
