// @flow

export type TestResult = {
  pass: boolean,
  message: string | () => string,
};

export type RawMatcherFn = (expected: any, actual: any) => TestResult;
export type ThrowingMatcherFn = (actual: any) => void;
export type MatchersObject = {[id:string]: RawMatcherFn};
