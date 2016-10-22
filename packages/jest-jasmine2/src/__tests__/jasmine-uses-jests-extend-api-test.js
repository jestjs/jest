describe('addMatcher Adapter', () => {
  const originalExtend = expect.extend;

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

    expect.extend({
      __specialExtend() {
        return { pass: true, message: '' };
      }
    })
  });

  afterAll(() => {
    expect.extend = originalExtend;
  });

  it('jasmine.addMatcher calls `expect.extend`', () => {
    expect.extend = jest.genMockFunction();

    jasmine.addMatchers({});

    expect(expect.extend).toBeCalled();
  });

  it("properly alias to Jest's api", () => {
    expect(1)._toBeValue(1);
    expect(1).not._toBeValue(2);
  });
})
