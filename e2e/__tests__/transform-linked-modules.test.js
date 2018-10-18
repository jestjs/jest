// @flow

'use strict';

import {json as runWithJson} from '../runJest';

it('should transform linked modules', () => {
  const {json: result} = runWithJson('transform-linked-modules', [
    '--no-cache',
  ]);

  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(2);
});
