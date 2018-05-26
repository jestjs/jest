import each from './';

const noop = () => {};
const expectFunction = expect.any(Function);

const get = (object, lensPath) => lensPath.reduce((acc, key) => acc[key], object);

describe('jest-each', () => {
  [
    ['test'],
    ['test', 'only'],
    ['it'],
    ['fit'],
    ['it', 'only'],
    ['describe'],
    ['fdescribe'],
    ['describe', 'only']
  ].forEach(keyPath => {
    describe(`.${keyPath.join('.')}`, () => {
      const getGlobalTestMocks = () => {
        const globals = {
          test: jest.fn(),
          it: jest.fn(),
          fit: jest.fn(),
          describe: jest.fn(),
          fdescribe: jest.fn()
        };
        globals.test.only = jest.fn();
        globals.it.only = jest.fn();
        globals.describe.only = jest.fn();
        return globals;
      };

      test('throws error when there are fewer arguments than headings when given one row', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} |
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('this will blow up :(', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(() => globalMock.mock.calls[0][1]()).toThrowErrorMatchingSnapshot();
        expect(testCallBack).not.toHaveBeenCalled();
      });

      test('throws error when there are fewer arguments than headings over multiple rows', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} |
        `;
        const testFunction = get(eachObject, keyPath);
        const testCallBack = jest.fn();
        testFunction('this will blow up :(', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        expect(() => globalMock.mock.calls[0][1]()).toThrowErrorMatchingSnapshot();
        expect(testCallBack).not.toHaveBeenCalled();
      });

      test('calls global with given title', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(1);
        expect(globalMock).toHaveBeenCalledWith('expected string', expectFunction);
      });

      test('calls global with given title when multiple tests cases exist', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith('expected string', expectFunction);
        expect(globalMock).toHaveBeenCalledWith('expected string', expectFunction);
      });

      test('calls global with title containing param values when using $variable format', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string: a=$a, b=$b, expected=$expected', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith('expected string: a=0, b=1, expected=1', expectFunction);
        expect(globalMock).toHaveBeenCalledWith('expected string: a=1, b=1, expected=2', expectFunction);
      });

      test('calls global with cb function with object built from tabel headings and values', () => {
        const globalTestMocks = getGlobalTestMocks();
        const testCallBack = jest.fn();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        globalMock.mock.calls[0][1]();
        expect(testCallBack).toHaveBeenCalledTimes(1);
        expect(testCallBack).toHaveBeenCalledWith({ a: 0, b: 1, expected: 1 });

        globalMock.mock.calls[1][1]();
        expect(testCallBack).toHaveBeenCalledTimes(2);
        expect(testCallBack).toHaveBeenCalledWith({ a: 1, b: 1, expected: 2 });
      });

      test('calls global with async done when cb function has more than one argument', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', ({ a, b, expected }, done) => {
          expect(a).toBe(0);
          expect(b).toBe(1);
          expect(expected).toBe(1);
          expect(done).toBe('DONE');
        });
        get(globalTestMocks, keyPath).mock.calls[0][1]('DONE');
      });
    });
  });

  [
    ['xtest'],
    ['test', 'skip'],
    ['xit'],
    ['it', 'skip'],
    ['xdescribe'],
    ['describe', 'skip'],
  ].forEach(keyPath => {
    describe(`.${keyPath.join('.')}`, () => {
      const getGlobalTestMocks = () => {
        const globals = {
          test: {
            skip: jest.fn()
          },
          xtest: jest.fn(),
          it: {
            skip: jest.fn()
          },
          xit: jest.fn(),
          describe: {
            skip: jest.fn()
          },
          xdescribe: jest.fn(),
        };
        return globals;
      };

      test('calls global with given title', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(1);
        expect(globalMock).toHaveBeenCalledWith('expected string', expectFunction);
      });

      test('calls global with given title when multiple tests cases exist', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith('expected string', expectFunction);
        expect(globalMock).toHaveBeenCalledWith('expected string', expectFunction);
      });

      test('calls global with title containing param values when using $variable format', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)`
          a    | b    | expected
          ${0} | ${1} | ${1}
          ${1} | ${1} | ${2}
        `;
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string: a=$a, b=$b, expected=$expected', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith('expected string: a=0, b=1, expected=1', expectFunction);
        expect(globalMock).toHaveBeenCalledWith('expected string: a=1, b=1, expected=2', expectFunction);
      });
    });
  });
});
