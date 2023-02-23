/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as os from 'os';
import * as path from 'path';
import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import {createScriptTransformer} from '@jest/transform';

jest.mock('vm');

const FILE_PATH_TO_INSTRUMENT = path.resolve(
  __dirname,
  './module_dir/to_be_instrumented.js',
);

it('instruments files', async () => {
  const config = makeProjectConfig({
    cache: false,
    cacheDirectory: os.tmpdir(),
    cwd: __dirname,
    rootDir: __dirname,
  });
  const scriptTransformer = await createScriptTransformer(config);

  const instrumented = scriptTransformer.transform(FILE_PATH_TO_INSTRUMENT, {
    ...makeGlobalConfig({collectCoverage: true}),
    changedFiles: undefined,
  });
  // We can't really snapshot the resulting coverage, because it depends on
  // absolute path of the file, which will be different on different
  // machines
  expect(instrumented.code).toMatch('gcv = "__coverage__"');
});
