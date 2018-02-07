// @flow

'use strict';

const runJest = require('../runJest');
const {extractSummary} = require('../utils');

it('should not run beforeall for disabled tests', () => {
  const result = runJest('beforeall-disabled', ['-t abc']);

  expect(result.stdout).toMatchSnapshot();
  expect(extractSummary(result.stderr).rest).toMatchSnapshot();
});
