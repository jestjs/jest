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

      test('calls global with given title', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)([[]]);
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(1);
        expect(globalMock).toHaveBeenCalledWith('expected string', expectFunction);
      });

      test('calls global with given title when multiple tests cases exist', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)([[], []]);
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith('expected string', expectFunction);
        expect(globalMock).toHaveBeenCalledWith('expected string', expectFunction);
      });

      test('calls global with title containing param values when using sprintf format', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)([['hello', 1], ['world', 2]]);
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string: %s %s', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith('expected string: hello 1', expectFunction);
        expect(globalMock).toHaveBeenCalledWith('expected string: world 2', expectFunction);
      });

      test('calls global with cb function containing all parameters of each test case', () => {
        const globalTestMocks = getGlobalTestMocks();
        const testCallBack = jest.fn();
        const eachObject = each.withGlobal(globalTestMocks)([['hello', 'world'], ['joe', 'bloggs']]);
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', testCallBack);

        const globalMock = get(globalTestMocks, keyPath);

        globalMock.mock.calls[0][1]();
        expect(testCallBack).toHaveBeenCalledTimes(1);
        expect(testCallBack).toHaveBeenCalledWith('hello', 'world');

        globalMock.mock.calls[1][1]();
        expect(testCallBack).toHaveBeenCalledTimes(2);
        expect(testCallBack).toHaveBeenCalledWith('joe', 'bloggs');
      });

      test('calls global with async done when cb function has more args than params of given test row', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)([['hello']]);

        const testFunction = get(eachObject, keyPath)
        testFunction('expected string', (hello, done) => {
          expect(hello).toBe('hello');
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
        const eachObject = each.withGlobal(globalTestMocks)([[]]);
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(1);
        expect(globalMock).toHaveBeenCalledWith('expected string', expectFunction);
      });

      test('calls global with given title when multiple tests cases exist', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)([[], []]);
        const testFunction = get(eachObject, keyPath);
        testFunction('expected string', noop);

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith('expected string', expectFunction);
      });

      test('calls global with title containing param values when using sprintf format', () => {
        const globalTestMocks = getGlobalTestMocks();
        const eachObject = each.withGlobal(globalTestMocks)([['hello', 1], ['world', 2]])
        const testFunction = get(eachObject, keyPath)
        testFunction('expected string: %s %s', () => {});

        const globalMock = get(globalTestMocks, keyPath);
        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith('expected string: hello 1', expectFunction);
        expect(globalMock).toHaveBeenCalledWith('expected string: world 2', expectFunction);
      });
    });
  });
});
