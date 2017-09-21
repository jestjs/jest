/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const os = require('os');
const docblock = require('../');

describe('docblock', () => {
  it('extracts valid docblock with line comment', () => {
    const code =
      '/**' +
      os.EOL +
      ' * @providesModule foo' +
      os.EOL +
      '* // TODO: test' +
      os.EOL +
      '*/' +
      os.EOL +
      'const x = foo;';
    expect(docblock.extract(code)).toBe(
      '/**' +
        os.EOL +
        ' * @providesModule foo' +
        os.EOL +
        '* // TODO: test' +
        os.EOL +
        '*/',
    );
  });

  it('extracts valid docblock', () => {
    const code =
      '/**' +
      os.EOL +
      ' * @providesModule foo' +
      os.EOL +
      '*/' +
      os.EOL +
      'const x = foo;';
    expect(docblock.extract(code)).toBe(
      '/**' + os.EOL + ' * @providesModule foo' + os.EOL + '*/',
    );
  });

  it('extracts valid docblock with more comments', () => {
    const code =
      '/**' +
      os.EOL +
      ' * @providesModule foo' +
      os.EOL +
      '*/' +
      os.EOL +
      'const x = foo;' +
      os.EOL +
      '/**foo*/';
    expect(docblock.extract(code)).toBe(
      '/**' + os.EOL + ' * @providesModule foo' + os.EOL + '*/',
    );
  });

  it('extracts from invalid docblock', () => {
    const code =
      '/*' +
      os.EOL +
      ' * @providesModule foo' +
      os.EOL +
      '*/' +
      os.EOL +
      'const x = foo;';
    expect(docblock.extract(code)).toBe(
      '/*' + os.EOL + ' * @providesModule foo' + os.EOL + '*/',
    );
  });

  it('returns extract and parsedocblock', () => {
    const code =
      '/** @provides module-name */' +
      os.EOL +
      '' +
      '' +
      os.EOL +
      '' +
      '.dummy {}' +
      os.EOL +
      '';

    expect(docblock.parse(docblock.extract(code))).toEqual({
      provides: 'module-name',
    });
  });

  it('parses directives out of a docblock', () => {
    const code =
      '/**' +
      os.EOL +
      '' +
      ' * @providesModule foo' +
      os.EOL +
      '' +
      ' * @css a b' +
      os.EOL +
      '' +
      ' * @preserve-whitespace' +
      os.EOL +
      '' +
      ' */';
    expect(docblock.parse(code)).toEqual({
      css: 'a b',
      'preserve-whitespace': '',
      providesModule: 'foo',
    });
  });

  it('parses directives out of a docblock with comments', () => {
    const code =
      '/**' +
      os.EOL +
      '' +
      ' * Copyright 2004-present Facebook. All Rights Reserved.' +
      os.EOL +
      '' +
      ' * @providesModule foo' +
      os.EOL +
      '' +
      ' * @css a b' +
      os.EOL +
      '' +
      ' *' +
      os.EOL +
      '' +
      ' * And some license here' +
      os.EOL +
      '' +
      ' * @preserve-whitespace' +
      os.EOL +
      '' +
      ' */';
    expect(docblock.parse(code)).toEqual({
      css: 'a b',
      'preserve-whitespace': '',
      providesModule: 'foo',
    });
  });

  it('parses directives out of a docblock with line comments', () => {
    const code =
      '/**' +
      os.EOL +
      '' +
      ' * @providesModule foo' +
      os.EOL +
      '' +
      ' * // TODO: test' +
      os.EOL +
      '' +
      ' */';
    expect(docblock.parse(code)).toEqual({
      providesModule: 'foo',
    });
  });

  it('parses multiline directives', () => {
    const code =
      '/**' +
      os.EOL +
      '' +
      ' * Copyright 2004-present Facebook. All Rights Reserved.' +
      os.EOL +
      '' +
      ' * @class A long declaration of a class' +
      os.EOL +
      '' +
      ' *        goes here, so we can read it and enjoy' +
      os.EOL +
      '' +
      ' *' +
      os.EOL +
      '' +
      ' * And some license here' +
      os.EOL +
      '' +
      ' * @preserve-whitespace' +
      os.EOL +
      '' +
      ' */';
    expect(docblock.parse(code)).toEqual({
      class:
        'A long declaration of a class goes here, ' +
        'so we can read it and enjoy',
      'preserve-whitespace': '',
    });
  });

  it('supports slashes in @providesModule directive', () => {
    const code =
      '/**' +
      os.EOL +
      '' +
      ' * @providesModule apple/banana' +
      os.EOL +
      '' +
      ' */';
    expect(docblock.parse(code)).toEqual({
      providesModule: 'apple/banana',
    });
  });

  it('extracts comments from docblock', () => {
    const code =
      '/**' +
      os.EOL +
      ' * hello world' +
      os.EOL +
      ' * @flow yes' +
      os.EOL +
      ' */';
    expect(docblock.parseWithComments(code)).toEqual({
      comments: 'hello world',
      pragmas: {flow: 'yes'},
    });
  });

  it('extracts multiline comments from docblock', () => {
    const code =
      '/**' +
      os.EOL +
      ' * hello' +
      os.EOL +
      ' * world' +
      os.EOL +
      ' * @flow yes' +
      os.EOL +
      ' */';
    expect(docblock.parseWithComments(code)).toEqual({
      comments: 'hello\nworld',
      pragmas: {flow: 'yes'},
    });
  });

  it('extracts comments from beginning and end of docblock', () => {
    const code =
      '/**' +
      os.EOL +
      ' * hello' +
      os.EOL +
      ' * @flow yes' +
      os.EOL +
      ' * ' +
      os.EOL +
      ' * world' +
      os.EOL +
      ' */';
    expect(docblock.parseWithComments(code)).toEqual({
      comments: 'hello\n\nworld',
      pragmas: {flow: 'yes'},
    });
  });

  it('prints docblocks with no keys as empty string', () => {
    const object = {};
    expect(docblock.print(object)).toEqual('');
  });

  it('prints docblocks with one key on one line', () => {
    const object = {flow: ''};
    expect(docblock.print(object)).toEqual('/** @flow */');
  });

  it('prints docblocks with multiple keys on multiple lines', () => {
    const object = {
      flow: '',
      format: '',
    };
    expect(docblock.print(object)).toEqual(
      '/**' + os.EOL + ' * @flow' + os.EOL + ' * @format' + os.EOL + ' */',
    );
  });

  it('prints docblocks with values', () => {
    const object = {
      flow: 'foo',
      providesModule: 'x/y/z',
    };
    expect(docblock.print(object)).toEqual(
      '/**' +
        os.EOL +
        ' * @flow foo' +
        os.EOL +
        ' * @providesModule x/y/z' +
        os.EOL +
        ' */',
    );
  });

  it('prints docblocks with comments', () => {
    const object = {flow: 'foo'};
    const comments = 'hello';
    expect(docblock.print(object, comments)).toEqual(
      '/**' +
        os.EOL +
        ' * hello' +
        os.EOL +
        ' *' +
        os.EOL +
        ' * @flow foo' +
        os.EOL +
        ' */',
    );
  });

  it('prints docblocks with comments and no keys', () => {
    const object = {};
    const comments = 'Copyright 2004-present Facebook. All Rights Reserved.';
    expect(docblock.print(object, comments)).toEqual(
      '/**' + os.EOL + ' * ' + comments + os.EOL + ' */',
    );
  });

  it('prints docblocks with multiline comments', () => {
    const object = {};
    const comments = 'hello' + os.EOL + 'world';
    expect(docblock.print(object, comments)).toEqual(
      '/**' + os.EOL + ' * hello' + os.EOL + ' * world' + os.EOL + ' */',
    );
  });

  it('prints docblocks that are parseable', () => {
    const object = {a: 'b', c: ''};
    const comments = 'hello world!';
    const formatted = docblock.print(object, comments);
    const parsed = docblock.parse(formatted);
    expect(parsed).toEqual(object);
  });
});
