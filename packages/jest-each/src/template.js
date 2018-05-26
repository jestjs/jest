export default defaultGlobal => ([headings], ...data) => {
  const keys = getHeadingKeys(headings);

  const keysLength = keys.length;

  if (data.length % keysLength !== 0) {
    const errorFunction = notEnoughDataError(keys, data);

    const test = errorFunction(defaultGlobal.test);
    test.only = errorFunction(defaultGlobal.test.only);

    const it = errorFunction(defaultGlobal.it);
    it.only = errorFunction(defaultGlobal.it.only);

    const fit = errorFunction(defaultGlobal.fit);

    const describe = errorFunction(defaultGlobal.describe);
    describe.only = errorFunction(defaultGlobal.describe.only);

    const fdescribe = errorFunction(defaultGlobal.fdescribe);

    return { test, it, fit, describe, fdescribe };
  }

  const parameterRows = Array.from({ length: data.length / keysLength })
    .map((_, index) => data.slice(index * keysLength, index * keysLength + keysLength))
    .map(row => row.reduce((acc, value, index) => ({ ...acc, [keys[index]]: value }), {}));

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

const notEnoughDataError = (keys, data) => cb => title =>
  cb(title, () => {
    throw new Error(
      `Tagged Template Literal test error:\nNot enough arguments supplied for given headings: ${keys.join(
        ' | '
      )}\nReceived: ${data}`
    );
  });

const getHeadingKeys = headings => headings.replace(/\s/g, '').split('|');

const parameterisedTests = parameterRows => globalCb => (title, test) => {
  parameterRows.forEach(params => globalCb(interpolate(title, params), applyTestParams(params, test)));
};

const interpolate = (title, data) => {
  const keys = Object.keys(data);
  return keys.reduce((acc, key) => acc.replace('$' + key, data[key]), title);
};

const applyTestParams = (params, test) => {
  if (test.length > 1) return done => test(params, done);

  return () => test(params);
};
