/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HasteImpl, WorkerMessage, WorkerMetadata} from './types';

import path from 'path';
import * as docblock from 'jest-docblock';
import fs from 'graceful-fs';
import blacklist from './blacklist';
import H from './constants';
import extractRequires from './lib/extract_requires';

const PACKAGE_JSON = path.sep + 'package.json';

let hasteImpl: ?HasteImpl = null;
let hasteImplModulePath: ?string = null;

export async function worker(data: WorkerMessage): Promise<WorkerMetadata> {
  if (
    data.hasteImplModulePath &&
    data.hasteImplModulePath !== hasteImplModulePath
  ) {
    if (hasteImpl) {
      throw new Error('jest-haste-map: hasteImplModulePath changed');
    }
    hasteImplModulePath = data.hasteImplModulePath;
    // $FlowFixMe: dynamic require
    hasteImpl = (require(hasteImplModulePath): HasteImpl);
  }

  const filePath = data.filePath;
  let module;
  let id: ?string;
  let dependencies;

  if (filePath.endsWith(PACKAGE_JSON)) {
    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (fileData.name) {
      id = fileData.name;
      module = [filePath, H.PACKAGE];
    }

    return {dependencies, id, module};
  }

  if (!blacklist.has(filePath.substr(filePath.lastIndexOf('.')))) {
    const content = fs.readFileSync(filePath, 'utf8');

    if (hasteImpl) {
      id = hasteImpl.getHasteName(filePath);
    } else {
      const doc = docblock.parse(docblock.extract(content));
      id = [].concat(doc.providesModule || doc.provides)[0];
    }

    dependencies = extractRequires(content);

    if (id) {
      module = [filePath, H.MODULE];
    }
  }

  return {dependencies, id, module};
}
