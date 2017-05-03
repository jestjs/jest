/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

describe('snapshot serializers', () => {
  it('works with first plugin', () => {
    const test = {
      foo: 1,
    };
    expect(test).toMatchSnapshot();
  });

  it('works with second plugin', () => {
    const test = {
      bar: 2,
    };
    expect(test).toMatchSnapshot();
  });

  it('works with nested serializable objects', () => {
    const test = {
      foo: {
        bar: 2,
      },
    };
    expect(test).toMatchSnapshot();
  });

  it('works with default serializers', () => {
    const test = {
      $$typeof: Symbol.for('react.test.json'),
      children: null,
      props: {
        id: 'foo',
      },
      type: 'div',
    };
    expect(test).toMatchSnapshot();
  });

  it('works with prepended plugins and default serializers', () => {
    const test = {
      $$typeof: Symbol.for('react.test.json'),
      children: null,
      props: {
        aProp: {a: 6},
        bProp: {foo: 8},
      },
      type: 'div',
    };
    expect(test).toMatchSnapshot();
  });

  it('works with prepended plugins from expect method called once', () => {
    const test = {
      $$typeof: Symbol.for('react.test.json'),
      children: null,
      props: {
        aProp: {a: 6},
        bProp: {foo: 8},
      },
      type: 'div',
    };
    // Add plugin that overrides foo specified by Jest config in package.json
    expect.addSnapshotSerializer({
      print: (val, serialize) => `Foo: ${serialize(val.foo)}`,
      test: val => val && val.hasOwnProperty('foo'),
    });
    expect(test).toMatchSnapshot();
  });

  it('works with prepended plugins from expect method called twice', () => {
    const test = {
      $$typeof: Symbol.for('react.test.json'),
      children: null,
      props: {
        aProp: {a: 6},
        bProp: {foo: 8},
      },
      type: 'div',
    };
    // Add plugin that overrides preceding added plugin
    expect.addSnapshotSerializer({
      print: (val, serialize) => `FOO: ${serialize(val.foo)}`,
      test: val => val && val.hasOwnProperty('foo'),
    });
    expect(test).toMatchSnapshot();
  });
});
