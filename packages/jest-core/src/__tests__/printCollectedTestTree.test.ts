/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {AssertionResult} from '@jest/test-result';
import {printCollectedTestTree} from '../runJest';

const makeResult = (
  title: string,
  ancestorTitles: Array<string> = [],
): AssertionResult => ({ancestorTitles, title}) as AssertionResult;

const collectOutput = (fn: (stream: NodeJS.WritableStream) => void): string => {
  const chunks: Array<string> = [];
  const stream = {write: (s: string) => chunks.push(s) && true};
  fn(stream as NodeJS.WritableStream);
  return chunks.join('');
};

describe('printCollectedTestTree', () => {
  test('prints top-level tests', () => {
    const output = collectOutput(stream =>
      printCollectedTestTree([makeResult('standalone')], stream),
    );
    expect(output).toContain('  standalone\n');
  });

  test('prints tests grouped by describe blocks', () => {
    const output = collectOutput(stream =>
      printCollectedTestTree(
        [makeResult('test a', ['suite']), makeResult('test b', ['suite'])],
        stream,
      ),
    );
    expect(output).toContain('suite\n');
    expect(output).toContain('  test a\n');
    expect(output).toContain('  test b\n');
  });

  test('prints nested describe blocks with indentation', () => {
    const output = collectOutput(stream =>
      printCollectedTestTree([makeResult('deep', ['outer', 'inner'])], stream),
    );
    expect(output).toContain('outer\n');
    expect(output).toContain('  inner\n');
    expect(output).toContain('    deep\n');
  });

  test('handles empty results', () => {
    const output = collectOutput(stream => printCollectedTestTree([], stream));
    expect(output).toBe('');
  });
});
