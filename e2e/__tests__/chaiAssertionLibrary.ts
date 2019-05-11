import path from 'path';
import {wrap} from 'jest-snapshot-serializer-raw';
import runJest from '../runJest';
import {extractSummary, run} from '../Utils';

test('chai assertion errors should display properly', () => {
  const dir = path.resolve(__dirname, '../chai-assertion-library-errors');
  run('yarn', dir);

  const {stderr} = runJest('chai-assertion-library-errors');
  const {rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
});
