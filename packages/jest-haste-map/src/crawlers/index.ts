/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {CrawlerOptions} from '../types';
import type {ResolvedBackend} from '../watchers/types';
import {nodeCrawl} from './node';
import {watchmanCrawl} from './watchman';

export async function crawl(
  crawlerOptions: CrawlerOptions,
  backend: ResolvedBackend,
  console: Console,
): ReturnType<typeof nodeCrawl> {
  if (backend === 'parcel') {
    throw new Error(
      '@parcel/watcher backend is not yet supported. Use haste.backend: "default" instead.',
    );
  }

  const crawlFn = backend === 'watchman' ? watchmanCrawl : nodeCrawl;

  const retry = (retryError: Error) => {
    if (crawlFn === watchmanCrawl) {
      console.warn(
        'jest-haste-map: Watchman crawl failed. Retrying once with node ' +
          'crawler.\n' +
          "  Usually this happens when watchman isn't running. Create an " +
          "empty `.watchmanconfig` file in your project's root folder or " +
          'initialize a git or hg repository in your project.\n' +
          `  ${retryError}`,
      );
      return nodeCrawl(crawlerOptions).catch(error => {
        throw new Error(
          'Crawler retry failed:\n' +
            `  Original error: ${retryError.message}\n` +
            `  Retry error: ${error.message}\n`,
        );
      });
    }

    throw retryError;
  };

  try {
    return await crawlFn(crawlerOptions);
  } catch (error: any) {
    return retry(error);
  }
}
