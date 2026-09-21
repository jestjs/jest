/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Control characters are not printable, so escaping them is the only way
// to make them visible in a diff.
const CONTROL_CHARACTERS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

// Invisible characters are zero width or blank, either because they are format
// (Cf) characters or because they are variation selectors or fillers. Because
// they are not visible, strings which differ by them look identical in a diff.
// Some of these are combining marks, so each character is matched on its own
// instead of combined with the character it follows.
const INVISIBLE_CHARACTERS =
  // eslint-disable-next-line no-misleading-character-class
  /[\u00AD\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\u3164\uFE00-\uFE0F\uFEFF\uFFA0]/g;

const escapeControlCharacter = (match: string): string => {
  switch (match) {
    case '\b':
      return '\\b';
    case '\f':
      return '\\f';
    case '\v':
      return '\\v';
    default:
      return `\\x${match.codePointAt(0)!.toString(16).padStart(2, '0')}`;
  }
};

const escapeInvisibleCharacter = (match: string): string =>
  `\\u${match.codePointAt(0)!.toString(16).padStart(4, '0')}`;

// Escape invisible characters to make them visible.
// Unlike in `escapeControlCharacters`, control characters are not escaped,
// because the values this is applied to can already contain ANSI escape
// sequences which are used to highlight the changes.
export const escapeInvisibleCharacters = (str: string): string =>
  str.replaceAll(INVISIBLE_CHARACTERS, escapeInvisibleCharacter);

// Escape control characters and invisible characters to make them visible in diffs
export const escapeControlCharacters = (str: string): string =>
  escapeInvisibleCharacters(
    str.replaceAll(CONTROL_CHARACTERS, escapeControlCharacter),
  );
