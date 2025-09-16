import {runTest} from '../__mocks__/testUtils';

test('Execute concurrent as a single sequential unit in each describe', () => {
  const {stdout} = runTest(`
    describe('foo', () => {
      beforeAll(() => {});
      afterAll(() => {});
      test.concurrent('A', () => {});
      test.concurrent('B', () => {});
      test('C', () => {});
      describe('bar', () => {
        beforeAll(() => {});
        afterAll(() => {});
        test.concurrent('D', () => {});
        test.concurrent('E', () => {});
        test('F', () => {});
      });
      describe('qux', () => {
        beforeAll(() => {});
        afterAll(() => {});
        test.concurrent('G', () => {});
        test.concurrent('H', () => {});
        test('I', () => {});
      });
    });
  `);

  expect(stdout).toMatchSnapshot();
});
