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
const Docblock = require('../');

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
  expect(new Docblock(code).originalDocblock).toBe(
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
  expect(new Docblock(code).originalDocblock).toBe(
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
  expect(new Docblock(code).originalDocblock).toBe(
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
  expect(new Docblock(code).originalDocblock).toBe(
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

  expect(new Docblock(code).getDirectives()).toEqual({
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
  expect(new Docblock(code).getDirectives()).toEqual({
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
  expect(new Docblock(code).getDirectives()).toEqual({
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
  expect(new Docblock(code).getDirectives()).toEqual({
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
  expect(new Docblock(code).getDirectives()).toEqual({
    class:
      'A long declaration of a class\n       goes here, ' +
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
  expect(new Docblock(code).getDirectives()).toEqual({
    providesModule: 'apple/banana',
  });
});

test('parses and prints back', () => {
  const code = `/**
 * Hey, i'm docblock
 * @flow
 * @format
 * @emails oncall+pizza+avacado
 * @multiline 12131214141
 *   234234234
 * other comments
 */

'use strict';

 /**
  * hey, i'm not docblock
  */
 module.exports = {};
  `;

  const docblock = new Docblock(code);
  expect(docblock.printFileContent()).toBe(code);
});

test('setting and deleting directives', () => {
  const code = `module.exports = {}`;

  const docblock = new Docblock(code);
  docblock.setDirective('hey');
  expect(docblock.printFileContent()).toMatchSnapshot();

  docblock.setDirective('pizza', 'cheese crust');
  expect(docblock.printFileContent()).toMatchSnapshot();

  docblock.setDirective('beef', 'a lot of\nmultiline\nbeef');
  expect(docblock.printFileContent()).toMatchSnapshot();

  docblock.deleteDirective('beef');
  expect(docblock.printFileContent()).toMatchSnapshot();

  docblock.deleteDirective('pizza');
  docblock.deleteDirective('hey');

  // back to original code with all directives deleted
  expect(docblock.printFileContent()).toBe(code);
});

test('retain newlines in the middle but not trailing/leading', () => {
  const code = `
  /**
   *
   * Copyright (c) 2015-present, Facebook, Inc.
   * All rights reserved.
   *
   * This source code is licensed under the BSD-style license found in the
   * LICENSE file in the root directory of this source tree. An additional grant
   * of patent rights can be found in the PATENTS file in the same directory.
   *
   * @flow
   *

   * @test
   */
  `.trim();

  const docblock = new Docblock(code);
  docblock.setDirective('providesModule', 'meatballs');
  docblock.deleteDirective('flow');

  expect(docblock.printFileContent()).toMatchSnapshot();
});
