/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {defineBrowserProvider} from '@jest/browser';
import {PlaywrightBrowserProvider} from './playwright';

export {PlaywrightBrowserProvider} from './playwright';
export {defineBrowserProvider} from '@jest/browser';

export function playwright(): ReturnType<typeof defineBrowserProvider> {
  return defineBrowserProvider({
    name: 'playwright',
    setup: async options => {
      const provider = new PlaywrightBrowserProvider();
      await provider.open(options);
      return provider;
    },
  });
}

export default playwright;
