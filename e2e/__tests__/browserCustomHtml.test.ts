import {resolve} from 'node:path';
import runJest from '../runJest';

const dir = resolve(__dirname, '../browser-custom-html');

test('custom testerHtmlPath injects custom HTML', () => {
  const result = runJest(dir, ['custom-html.test.ts']);
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toContain('2 passed');
});
