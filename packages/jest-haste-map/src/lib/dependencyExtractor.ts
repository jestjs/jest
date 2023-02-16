/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {DependencyExtractor} from '../types';

const NOT_A_DOT = '(?<!\\.\\s*)';
const CAPTURE_STRING_LITERAL = (pos: number) =>
  `([\`'"])([^'"\`]*?)(?:\\${pos})`;
const WORD_SEPARATOR = '\\b';
const LEFT_PARENTHESIS = '\\(';
const RIGHT_PARENTHESIS = '\\)';
const WHITESPACE = '\\s*';
const OPTIONAL_COMMA = '(:?,\\s*)?';

function createRegExp(parts: Array<string>, flags: string) {
  return new RegExp(parts.join(''), flags);
}

function alternatives(...parts: Array<string>) {
  return `(?:${parts.join('|')})`;
}

function functionCallStart(...names: Array<string>) {
  return [
    NOT_A_DOT,
    WORD_SEPARATOR,
    alternatives(...names),
    WHITESPACE,
    LEFT_PARENTHESIS,
    WHITESPACE,
  ];
}

const BLOCK_COMMENT_RE = /\/\*[^]*?\*\//g;
const LINE_COMMENT_RE = /\/\/.*/g;

const REQUIRE_OR_DYNAMIC_IMPORT_RE = createRegExp(
  [
    ...functionCallStart('require', 'import'),
    CAPTURE_STRING_LITERAL(1),
    WHITESPACE,
    OPTIONAL_COMMA,
    RIGHT_PARENTHESIS,
  ],
  'g',
);

const IMPORT_OR_EXPORT_RE = createRegExp(
  [
    '\\b(?:import|export)\\s+(?!type(?:of)?\\s+)(?:[^\'"]+\\s+from\\s+)?',
    CAPTURE_STRING_LITERAL(1),
  ],
  'g',
);

const JEST_EXTENSIONS_RE = createRegExp(
  [
    ...functionCallStart(
      'jest\\s*\\.\\s*(?:requireActual|requireMock|genMockFromModule|createMockFromModule)',
    ),
    CAPTURE_STRING_LITERAL(1),
    WHITESPACE,
    OPTIONAL_COMMA,
    RIGHT_PARENTHESIS,
  ],
  'g',
);

export const extractor: DependencyExtractor = {
  extract(code) {
    const dependencies = new Set<string>();

    const addDependency = (match: string, _: string, dep: string) => {
      dependencies.add(dep);
      return match;
    };

    code
      .replace(BLOCK_COMMENT_RE, '')
      .replace(LINE_COMMENT_RE, '')
      .replace(IMPORT_OR_EXPORT_RE, addDependency)
      .replace(REQUIRE_OR_DYNAMIC_IMPORT_RE, addDependency)
      .replace(JEST_EXTENSIONS_RE, addDependency);

    return dependencies;
  },
};
