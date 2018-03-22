/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HasteImpl, WorkerMessage, WorkerMetadata} from './types';

import crypto from 'crypto';
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
  let content;
  let dependencies;
  let id;
  let module;
  let sha1;

  // Process a package.json that is returned as a PACKAGE type with its name.
  if (filePath.endsWith(PACKAGE_JSON)) {
    content = fs.readFileSync(filePath, 'utf8');
    const fileData = JSON.parse(content);

    if (fileData.name) {
      id = fileData.name;
      module = [filePath, H.PACKAGE];
    }

    // Process a randome file that is returned as a MODULE.
  } else if (!blacklist.has(filePath.substr(filePath.lastIndexOf('.')))) {
    content = fs.readFileSync(filePath, 'utf8');

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

  // If a SHA-1 is requested on update, compute it.
  if (data.computeSha1) {
    if (content == null) {
      content = fs.readFileSync(filePath);
    }

    sha1 = crypto
      .createHash('sha1')
      .update(content)
      .digest('hex');
  }

  return {dependencies, id, module, sha1};
}
