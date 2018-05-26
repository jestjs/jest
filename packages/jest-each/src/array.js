import { vsprintf } from 'sprintf-js';

export default defaultGlobal => parameterRows => {

  const tests = parameterisedTests(parameterRows);

  const globalTest = defaultGlobal.test;
  const test = tests(globalTest);
  test.skip = tests(globalTest.skip);
  test.only = tests(globalTest.only);

  const globalIt = defaultGlobal.it;
  const it = tests(globalIt);
  it.skip = tests(globalIt.skip);
  it.only = tests(globalIt.only);

  const xtest = tests(defaultGlobal.xtest);
  const xit = tests(defaultGlobal.xit);
  const fit = tests(defaultGlobal.fit);

  const globalDescribe = defaultGlobal.describe;
  const describe = tests(globalDescribe);
  describe.skip = tests(globalDescribe.skip);
  describe.only = tests(globalDescribe.only);
  const fdescribe = tests(defaultGlobal.fdescribe);
  const xdescribe = tests(defaultGlobal.xdescribe);

  return { test, xtest, it, xit, fit, describe, fdescribe, xdescribe };
};

const parameterisedTests = parameterRows => globalCb => (title, test) => {
  parameterRows.forEach(params => globalCb(vsprintf(title, params), applyTestParams(params, test)));
};

const applyTestParams = (params, test) => {
  if (params.length < test.length)
    return (done) => test(...params, done);

  return () => test(...params);
};
