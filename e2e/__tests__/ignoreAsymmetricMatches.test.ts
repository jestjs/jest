import * as path from 'path';
import runJest from '../runJest';
import {extractSummary} from '../Utils';

const dir = path.resolve(__dirname, '../ignore-asymmetric-matches');

test('should not ignore in default', () => {
  const {stderr} = runJest(dir);
  const {rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
});

test('should ignore with --ignoreAsymmetricMatches cli option', () => {
  const {stderr} = runJest(dir, ['--ignoreAsymmetricMatches']);
  const {rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
});

test('should ignore with ignoreAsymmetricMatches=true in config', () => {
  const {stderr} = runJest(dir, [
    '--config',
    JSON.stringify({ignoreAsymmetricMatches: true}),
  ]);
  const {rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
});

test('should not ignore with ignoreAsymmetricMatches=false in config', () => {
  const {stderr} = runJest(dir, [
    '--config',
    JSON.stringify({ignoreAsymmetricMatches: false}),
  ]);
  const {rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
});
