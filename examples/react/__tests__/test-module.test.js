import testModule from 'example-test-module';

it('Import test-module from browser', () => {
  expect(testModule.comingFrom).toBe('browser');
});
