import type * as jestMatcherUtils from 'jest-matcher-utils';

// TODO remove in Jest 28, the utils must be imported from 'jest-matcher-utils'
declare module '@jest/types' {
  namespace Expect {
    interface MatcherState {
      utils: typeof jestMatcherUtils & {
        iterableEquality: Tester;
        subsetEquality: Tester;
      };
    }
  }
}
