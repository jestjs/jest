/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
describe('`done()` called more than once', () => {
  it('should fail', done => {
    done();
    done();
  });

  it('should fail inside a promise', done => {
    Promise.resolve()
      .then(() => {
        done();
        done();
      })
      .catch(error => error);
  });
});

describe('multiple `done()` inside beforeEach', () => {
  beforeEach(done => {
    done();
    done();
  });

  it('should fail', () => {
    expect('foo').toMatch('foo');
  });
});

describe('multiple `done()` inside afterEach', () => {
  afterEach(done => {
    done();
    done();
  });

  it('should fail', () => {
    expect('foo').toMatch('foo');
  });
});

describe('multiple `done()` inside beforeAll', () => {
  beforeAll(done => {
    done();
    done();
  });

  it('should fail', () => {
    expect('foo').toMatch('foo');
  });
});

describe('multiple `done()` inside afterAll', () => {
  afterAll(done => {
    done();
    done();
  });

  it('should fail', () => {
    expect('foo').toMatch('foo');
  });
});
