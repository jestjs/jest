describe('addMatcher Adapter', () => {
  beforeEach(() => {
    jasmine.addMatchers({
      _toBeValue(util, customEqualityTesters) {
        return {
          compare(actual, expected) {
            const pass = actual == expected;

            return {
              message: `Expected ${pass} to be same value as ${expected}`,
              pass,
            };
          }
        }
      }
    });
  });

  it('jasmine.addMatcher calls `expect.extend`', () => {
    const originalExtend = expect.extend;
    expect.extend = jest.genMockFunction();

    jasmine.addMatchers({});

    expect(expect.extend).toBeCalled();
    expect.extend = originalExtend;
  });

  it('properly alias to jests api', () => {
    expect(1)._toBeValue(1);
    expect(1).not._toBeValue(2);
  });
})
