/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {onNodeVersions} from '@jest/test-utils';

let runtime;

// version where `vm` API gets `import assertions`
onNodeVersions('>=16.12.0', () => {
  beforeAll(async () => {
    const createRuntime = require('createRuntime');

    runtime = await createRuntime(__filename);
  });

  describe('import assertions', () => {
    const jsonFileName = `${__filename}on`;

    it('works if passed correct import assertion', () => {
      expect(() =>
        runtime.validateImportAssertions(jsonFileName, '', {type: 'json'}),
      ).not.toThrow();
    });

    it('does nothing if no assertions passed for js file', () => {
      expect(() =>
        runtime.validateImportAssertions(__filename, '', undefined),
      ).not.toThrow();
    });

    it('throws if invalid assertions are passed', () => {
      expect(() =>
        runtime.validateImportAssertions(__filename, '', {}),
      ).toThrow('Import assertion value must be a string');
      expect(() =>
        runtime.validateImportAssertions(__filename, '', {
          somethingElse: 'json',
        }),
      ).toThrow('Import assertion value must be a string');
      expect(() =>
        runtime.validateImportAssertions(__filename, '', {type: null}),
      ).toThrow('Import assertion value must be a string');
      expect(() =>
        runtime.validateImportAssertions(__filename, '', {type: 42}),
      ).toThrow('Import assertion value must be a string');
      expect(() =>
        runtime.validateImportAssertions(__filename, '', {type: 'javascript'}),
      ).toThrow('Import assertion type "javascript" is unsupported');
    });

    it('throws if missing json assertions', () => {
      expect(() => runtime.validateImportAssertions(jsonFileName, '')).toThrow(
        `Module "${jsonFileName}" needs an import assertion of type "json"`,
      );
    });

    it('throws if json assertion passed on wrong file', () => {
      expect(() =>
        runtime.validateImportAssertions(__filename, '', {type: 'json'}),
      ).toThrow(`Module "${__filename}" is not of type "json"`);
    });
  });
});
