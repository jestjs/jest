import installEach from '../each';

const noop = () => {};
const expectFunction = expect.any(Function);

describe('installEach', () => {
  [
    ['it'],
    ['fit'],
    ['xit'],
    ['describe'],
    ['fdescribe'],
    ['xdescribe'],
  ].forEach(keyPath => {
    describe(`.${keyPath.join('.')}`, () => {
      const getEnvironmentMock = () => {
        return {
          global: {
            describe: jest.fn(),
            fdescribe: jest.fn(),
            fit: jest.fn(),
            it: jest.fn(),
            xdescribe: jest.fn(),
            xit: jest.fn(),
          },
        };
      };

      test('calls global function with given title', () => {
        const environmentMock = getEnvironmentMock();
        installEach(environmentMock);

        const globalMock = environmentMock.global[keyPath];

        globalMock.each([[]])('expected string', noop);

        expect(globalMock).toHaveBeenCalledTimes(1);
        expect(globalMock).toHaveBeenCalledWith(
          'expected string',
          expectFunction,
        );
      });

      test('calls global function with given title when multiple tests cases exist', () => {
        const environmentMock = getEnvironmentMock();
        installEach(environmentMock);

        const globalMock = environmentMock.global[keyPath];

        globalMock.each([[], []])('expected string', noop);

        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith(
          'expected string',
          expectFunction,
        );
        expect(globalMock).toHaveBeenCalledWith(
          'expected string',
          expectFunction,
        );
      });

      test('calls global function with title containing param values when using sprintf format', () => {
        const environmentMock = getEnvironmentMock();
        installEach(environmentMock);

        const globalMock = environmentMock.global[keyPath];

        globalMock.each([['hello', 1], ['world', 2]])(
          'expected string: %s %s',
          noop,
        );

        expect(globalMock).toHaveBeenCalledTimes(2);
        expect(globalMock).toHaveBeenCalledWith(
          'expected string: hello 1',
          expectFunction,
        );
        expect(globalMock).toHaveBeenCalledWith(
          'expected string: world 2',
          expectFunction,
        );
      });

      test('calls global function with cb function containing all parameters of each test case', () => {
        const environmentMock = getEnvironmentMock();
        installEach(environmentMock);

        const globalMock = environmentMock.global[keyPath];
        const testCallBack = jest.fn();
        globalMock.each([['hello', 'world'], ['joe', 'bloggs']])(
          'expected string: %s %s',
          testCallBack,
        );

        globalMock.mock.calls[0][1]();
        expect(testCallBack).toHaveBeenCalledTimes(1);
        expect(testCallBack).toHaveBeenCalledWith('hello', 'world');

        globalMock.mock.calls[1][1]();
        expect(testCallBack).toHaveBeenCalledTimes(2);
        expect(testCallBack).toHaveBeenCalledWith('joe', 'bloggs');
      });

      test('calls global function with async done when cb function has more args than params of given test row', () => {
        expect.hasAssertions();
        const environmentMock = getEnvironmentMock();
        installEach(environmentMock);

        const globalMock = environmentMock.global[keyPath];
        globalMock.each([['hello']])('a title', (hello, done) => {
          expect(hello).toBe('hello');
          expect(done).toBe('DONE');
        });

        globalMock.mock.calls[0][1]('DONE');
      });
    });
  });
});
