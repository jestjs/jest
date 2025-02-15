/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {runTest} from '../__mocks__/testUtils';

test('beforeEach is executed before each test in current/child describe blocks', () => {
  const {stdout} = runTest(`
    describe('describe', () => {
      beforeEach(() => console.log('> describe beforeEach'));
      test('one', () => {});
      test('two', () => {});
      describe('2nd level describe', () => {
        beforeEach(() => console.log('> 2nd level describe beforeEach'));
        test('2nd level test', () => {});

        describe('3rd level describe', () => {
          test('3rd level test', () => {});
          test('3rd level test#2', () => {});
        });
      });
    })

    describe('2nd describe', () => {
      beforeEach(() => {
        console.log('> 2nd describe beforeEach that throws')
        throw new Error('alabama');
      });
      test('2nd describe test', () => {});
    })
  `);

  expect(stdout).toMatchSnapshot();
});

test('multiple before each hooks in one describe are executed in the right order', () => {
  const {stdout} = runTest(`
    describe('describe 1', () => {
      beforeEach(() => {
        console.log('before each 1');
      });
      beforeEach(() => {
        console.log('before each 2');
      });

      describe('2nd level describe', () => {
        test('test', () => {});
      });
    });
  `);

  expect(stdout).toMatchSnapshot();
});

test('beforeEach can return a cleanup function, run in the correct order relative to afterEach hooks', () => {
  const {stdout} = runTest(`
    describe('describe', () => {
      afterEach(() => {
        console.log('> afterEach 1 (defined first)');
      });

      beforeEach(() => {
        console.log('> beforeEach 1');
        return () => {
          console.log('> cleanup 1');
        };
      });

      afterEach(() => {
        console.log('> afterEach 2');
      });

      beforeEach(() => {
        console.log('> beforeEach 2');
        return () => {
          console.log('> cleanup 2');
        };
      });

      afterEach(() => {
        console.log('> afterEach 3 (defined last)');
      });

      test('test', () => {
        console.log('> test');
      });
    });
  `);

  expect(stdout).toMatchSnapshot();
});


test('beforeAll is exectued correctly', () => {
  const {stdout} = runTest(`
    describe('describe 1', () => {
      beforeAll(() => console.log('> beforeAll 1'));
      test('test 1', () => console.log('> test 1'));

      describe('2nd level describe', () => {
        beforeAll(() => console.log('> beforeAll 2'));
        test('test 2', () => console.log('> test 2'));
        test('test 3', () => console.log('> test 3'));
      });
    });
  `);

  expect(stdout).toMatchSnapshot();
});

test('beforeAll can return a cleanup function, run in the correct order relative to afterAll hooks', () => {
  const {stdout} = runTest(`
    describe('describe', () => {
      afterAll(() => {
        console.log('> afterAll 1 (defined first)');
      });

      beforeAll(() => {
        console.log('> beforeAll 1');
        return () => {
          console.log('> cleanup 1');
        };
      });

      afterAll(() => {
        console.log('> afterAll 2');
      });

      beforeAll(() => {
        console.log('> beforeAll 2');
        return () => {
          console.log('> cleanup 2');
        };
      });

      afterAll(() => {
        console.log('> afterAll 3 (defined last)');
      });

      test('test', () => {
        console.log('> test');
      });
    });
  `);

  expect(stdout).toMatchSnapshot();
});

test('cleanup functions run in the correct order with nested describes', () => {
  const {stdout} = runTest(`
    describe('outer describe', () => {
      afterAll(() => {
        console.log('> outer afterAll 1 (defined first)');
      });

      beforeAll(() => {
        console.log('> outer beforeAll');
        return () => {
          console.log('> outer cleanup');
        };
      });

      afterAll(() => {
        console.log('> outer afterAll 2 (defined last)');
      });

      describe('inner describe', () => {
        afterAll(() => {
          console.log('> inner afterAll 1 (defined first)');
        });

        beforeAll(() => {
          console.log('> inner beforeAll');
          return () => {
            console.log('> inner cleanup');
          };
        });

        afterAll(() => {
          console.log('> inner afterAll 2 (defined last)');
        });

        test('test', () => {
          console.log('> test');
        });
      });
    });
  `);

  expect(stdout).toMatchSnapshot();
});

test('async cleanup functions are properly awaited', () => {
  const {stdout} = runTest(`
    let value = 0;
    describe('describe', () => {
      beforeEach(() => {
        value += 1;
        console.log('> beforeEach value:', value);
        return async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
          value -= 1;
          console.log('> cleanup value:', value);
        };
      });
      
      afterEach(() => {
        console.log('> afterEach value:', value);
      });

      test('test', () => {
        console.log('> test value:', value);
      });
    });

    describe('describe with beforeAll', () => {
      beforeAll(() => {
        value += 2;
        console.log('> beforeAll value:', value);
        return async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
          value -= 2;
          console.log('> cleanup value:', value);
        };
      });
      
      afterAll(() => {
        console.log('> afterAll value:', value);
      });

      test('test', () => {
        console.log('> test value:', value);
      });
    });
  `);

  expect(stdout).toMatchSnapshot();
});