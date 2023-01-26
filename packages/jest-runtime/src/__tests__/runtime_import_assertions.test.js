/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {pathToFileURL} from 'url';
import {onNodeVersions} from '@jest/test-utils';

let runtime;

// version where `vm` API gets `import assertions`
onNodeVersions('>=16.12.0', () => {
  beforeAll(async () => {
    const createRuntime = require('createRuntime');

    runtime = await createRuntime(__filename);
  });

  describe('import assertions', () => {
    const fileUrl = pathToFileURL(__filename).href;
    const jsonFileName = `${__filename}on`;
    const jsonFileUrl = pathToFileURL(jsonFileName).href;

    it('works if passed correct import assertion', () => {
      expect(() =>
        runtime.validateImportAssertions(jsonFileName, '', {type: 'json'}),
      ).not.toThrow();
    });

    it('does nothing if no assertions passed for js file', () => {
      expect(() =>
        runtime.validateImportAssertions(__filename, '', undefined),
      ).not.toThrow();
      expect(() =>
        runtime.validateImportAssertions(__filename, '', {}),
      ).not.toThrow();
    });

    it('throws if invalid assertions are passed', () => {
      expect(() =>
        runtime.validateImportAssertions(jsonFileName, '', {type: null}),
      ).toThrow('Import assertion value must be a string');
      expect(() =>
        runtime.validateImportAssertions(jsonFileName, '', {type: 42}),
      ).toThrow('Import assertion value must be a string');
      expect(() =>
        runtime.validateImportAssertions(jsonFileName, '', {
          type: 'javascript',
        }),
      ).toThrow('Import assertion type "javascript" is unsupported');
    });

    it('throws if missing json assertions', () => {
      const errorMessage = `Module "${jsonFileUrl}" needs an import assertion of type "json"`;

      expect(() =>
        runtime.validateImportAssertions(jsonFileName, '', {}),
      ).toThrow(errorMessage);
      expect(() =>
        runtime.validateImportAssertions(jsonFileName, '', {
          somethingElse: 'json',
        }),
      ).toThrow(errorMessage);
      expect(() => runtime.validateImportAssertions(jsonFileName, '')).toThrow(
        errorMessage,
      );
    });

    it('throws if json assertion passed on wrong file', () => {
      expect(() =>
        runtime.validateImportAssertions(__filename, '', {type: 'json'}),
      ).toThrow(`Module "${fileUrl}" is not of type "json"`);
    });
  });
});
