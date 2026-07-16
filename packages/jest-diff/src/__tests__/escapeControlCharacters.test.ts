/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {escapeControlCharacters} from '../escapeControlCharacters';

describe('escapeControlCharacters', () => {
  test('preserves regular printable characters', () => {
    const input = 'Jest 123!@#$%^&*()';
    expect(escapeControlCharacters(input)).toBe(input);
  });

  test('preserves whitespace characters that are meaningful for formatting', () => {
    const input = 'line1\nline2\tindented\rcarriage';
    expect(escapeControlCharacters(input)).toBe(input);
  });

  test('escapes NULL character', () => {
    const input = 'before\u0000after';
    expect(escapeControlCharacters(input)).toBe('before\\x00after');
  });

  test('escapes SOH (Start of Heading) character', () => {
    const input = 'before\u0001after';
    expect(escapeControlCharacters(input)).toBe('before\\x01after');
  });

  test('escapes backspace character to \\b', () => {
    const input = 'before\u0008after';
    expect(escapeControlCharacters(input)).toBe('before\\bafter');
  });

  test('escapes vertical tab character to \\v', () => {
    const input = 'before\u000Bafter';
    expect(escapeControlCharacters(input)).toBe('before\\vafter');
  });

  test('escapes form feed character to \\f', () => {
    const input = 'before\u000Cafter';
    expect(escapeControlCharacters(input)).toBe('before\\fafter');
  });

  test('escapes ESC (Escape) character', () => {
    const input = 'before\u001Bafter';
    expect(escapeControlCharacters(input)).toBe('before\\x1bafter');
  });

  test('escapes DEL character', () => {
    const input = 'before\u007Fafter';
    expect(escapeControlCharacters(input)).toBe('before\\x7fafter');
  });

  test('escapes C1 control characters', () => {
    const input = 'before\u0080\u0081\u009Fafter';
    expect(escapeControlCharacters(input)).toBe('before\\x80\\x81\\x9fafter');
  });

  test('handles mixed control characters and regular text', () => {
    const input = 'FIX\u00014.4\u00019=68\u00135=A\u0001MSG_TYPE=D';
    expect(escapeControlCharacters(input)).toBe(
      'FIX\\x014.4\\x019=68\\x135=A\\x01MSG_TYPE=D',
    );
  });

  test('handles financial message protocol string with control characters', () => {
    const input = '8=FIXT.1.1\u00019=68\u00135=A\u00134=1\u00149=ISLD';
    expect(escapeControlCharacters(input)).toBe(
      '8=FIXT.1.1\\x019=68\\x135=A\\x134=1\\x149=ISLD',
    );
  });

  test('preserves empty string', () => {
    expect(escapeControlCharacters('')).toBe('');
  });

  test('handles string with only control characters', () => {
    const input = '\u0000\u0001\u0002\u0003';
    expect(escapeControlCharacters(input)).toBe('\\x00\\x01\\x02\\x03');
  });

  test('preserves Unicode characters that are not control characters', () => {
    const input = 'café 中文 🚀 αβγ';
    expect(escapeControlCharacters(input)).toBe(input);
  });

  test('handles BEL (Bell) character', () => {
    const input = 'alert\u0007sound';
    expect(escapeControlCharacters(input)).toBe('alert\\x07sound');
  });

  test('preserves newlines in multiline strings', () => {
    const input = 'line 1\nline 2\nline 3';
    expect(escapeControlCharacters(input)).toBe(input);
  });

  test('preserves tabs for code formatting', () => {
    const input = 'function() {\n\treturn true;\n}';
    expect(escapeControlCharacters(input)).toBe(input);
  });

  test('escapes multiple consecutive control characters', () => {
    const input = 'data\u0001\u0002\u0003separator';
    expect(escapeControlCharacters(input)).toBe('data\\x01\\x02\\x03separator');
  });

  test('handles control characters at string boundaries', () => {
    const startControl = '\u0001start';
    const endControl = 'end\u0001';
    expect(escapeControlCharacters(startControl)).toBe('\\x01start');
    expect(escapeControlCharacters(endControl)).toBe('end\\x01');
  });
});
