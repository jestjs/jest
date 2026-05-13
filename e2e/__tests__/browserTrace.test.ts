/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import * as path from 'path';
import runJest from '../runJest';

const dir = path.resolve(__dirname, '../browser-trace');
const packageJsonPath = path.resolve(dir, 'package.json');
const traceDir = path.resolve(dir, '__traces__');

const originalPackageJson = fs.readFileSync(packageJsonPath, 'utf8');

function cleanupTraceDir(): void {
  fs.rmSync(traceDir, {force: true, recursive: true});
}

function setTraceMode(mode: 'on' | 'retain-on-failure' | 'off'): void {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    jest: {
      browserMode: {
        trace?: 'on' | 'retain-on-failure' | 'off';
      };
    };
  };

  if (mode === 'off') {
    delete pkg.jest.browserMode.trace;
  } else {
    pkg.jest.browserMode.trace = mode;
  }

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function getTraceFiles(root: string): Array<string> {
  if (!fs.existsSync(root)) {
    return [];
  }

  const files: Array<string> = [];
  for (const entry of fs.readdirSync(root, {withFileTypes: true})) {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...getTraceFiles(entryPath));
      continue;
    }

    if (entry.name.endsWith('.trace.zip')) {
      files.push(entryPath);
    }
  }

  return files;
}

describe('browser trace recording', () => {
  beforeAll(() => {
    cleanupTraceDir();
  });

  afterAll(() => {
    fs.writeFileSync(packageJsonPath, originalPackageJson);
    cleanupTraceDir();
  });

  test("trace='on' writes .trace.zip", () => {
    setTraceMode('on');
    cleanupTraceDir();

    const result = runJest(dir, ['__tests__/passing.test.ts']);

    expect(result.exitCode).toBe(0);
    expect(getTraceFiles(traceDir).length).toBeGreaterThan(0);
  });

  test("trace='retain-on-failure' keeps trace only for failing test", () => {
    setTraceMode('retain-on-failure');
    cleanupTraceDir();

    const result = runJest(dir, [
      '__tests__/passing.test.ts',
      '__tests__/failing.test.ts',
    ]);

    const traceFiles = getTraceFiles(traceDir);

    expect(result.exitCode).toBe(1);
    expect(traceFiles).toHaveLength(1);
  });

  test("trace='off' (default) writes no traces", () => {
    setTraceMode('off');
    cleanupTraceDir();

    const result = runJest(dir, ['__tests__/passing.test.ts']);

    expect(result.exitCode).toBe(0);
    expect(getTraceFiles(traceDir)).toHaveLength(0);
  });
});
