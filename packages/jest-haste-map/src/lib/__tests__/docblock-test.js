/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

jest.unmock('../docblock');

let os;
let docblock;

describe('docblock', () => {

  beforeEach(() => {
    os = require('os');
    docblock = require('../docblock');
  });

  it('extracts valid docblock', () => {
    const code =
      '/**' + os.EOL + ' * @providesModule foo' + os.EOL + '*/' + os.EOL +
      'const x = foo;';
    expect(docblock.extract(code)).toBe(
      '/**' + os.EOL + ' * @providesModule foo' + os.EOL + '*/'
    );
  });

  it('extracts valid docblock with more comments', () => {
    const code =
      '/**' + os.EOL + ' * @providesModule foo' + os.EOL + '*/' + os.EOL +
      'const x = foo;' + os.EOL + '/**foo*/';
    expect(docblock.extract(code)).toBe(
      '/**' + os.EOL + ' * @providesModule foo' + os.EOL + '*/'
    );
  });

  it('returns nothing for no docblock', () => {
    const code =
      '/*' + os.EOL + ' * @providesModule foo' + os.EOL + '*/' + os.EOL +
      'const x = foo;' + os.EOL + '/**foo*/';
    expect(docblock.extract(code)).toBe('');
  });

  it('returns extract and parsedocblock', () => {
    const code =
      '/** @provides module-name */' + os.EOL + '' +
      '' + os.EOL + '' +
      '.dummy {}' + os.EOL + '';

    expect(docblock.parse(docblock.extract(code))).toEqual({
      'provides': 'module-name',
    });
  });

  it('parses directives out of a docblock', () => {
    const code =
      '/**' + os.EOL + '' +
      ' * @providesModule foo' + os.EOL + '' +
      ' * @css a b' + os.EOL + '' +
      ' * @preserve-whitespace' + os.EOL + '' +
      ' */';
    expect(docblock.parse(code)).toEqual({
      'providesModule': 'foo',
      'css': 'a b',
      'preserve-whitespace': '',
    });
  });

  it('parses directives out of a docblock with comments', () => {
    const code =
      '/**' + os.EOL + '' +
      ' * Copyright 2004-present Facebook. All Rights Reserved.' + os.EOL + '' +
      ' * @providesModule foo' + os.EOL + '' +
      ' * @css a b' + os.EOL + '' +
      ' *' + os.EOL + '' +
      ' * And some license here' + os.EOL + '' +
      ' * @preserve-whitespace' + os.EOL + '' +
      ' */';
    expect(docblock.parse(code)).toEqual({
      'providesModule': 'foo',
      'css': 'a b',
      'preserve-whitespace': '',
    });
  });

  it('parses multiline directives', () => {
    const code =
      '/**' + os.EOL + '' +
      ' * Copyright 2004-present Facebook. All Rights Reserved.' + os.EOL + '' +
      ' * @class A long declaration of a class' + os.EOL + '' +
      ' *        goes here, so we can read it and enjoy' + os.EOL + '' +
      ' *' + os.EOL + '' +
      ' * And some license here' + os.EOL + '' +
      ' * @preserve-whitespace' + os.EOL + '' +
      ' */';
    expect(docblock.parse(code)).toEqual({
      'class': 'A long declaration of a class goes here, ' +
        'so we can read it and enjoy',
      'preserve-whitespace': '',
    });
  });
});
