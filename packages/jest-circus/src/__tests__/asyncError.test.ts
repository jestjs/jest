describe('async error handling', () => {
  it('does not crash when asyncError is undefined and a plain object is thrown', done => {
    const {test} = require('../');

    test('inner test', (innerDone: any) => {
      // simulate async error path (where asyncError can be undefined)
      Promise.resolve().then(() => {
        throw {status: 403, message: 'Forbidden'};
      });

      innerDone();
    });

    done();
  });
});
