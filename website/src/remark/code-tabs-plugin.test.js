/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import fs from 'graceful-fs';
import remarkMdx from 'remark-mdx';
import remark from 'remark';
import codeTabsPlugin from './code-tabs-plugin';

const processFixture = async name => {
  const filePath = path.join(__dirname, '__fixtures__', `${name}.md`);
  const file = fs.readFileSync(filePath);
  const result = await remark()
    .use(remarkMdx)
    .use(codeTabsPlugin)
    .process(file);

  return result.toString();
};

describe('code tabs plugin', () => {
  test('base example', async () => {
    const result = await processFixture('base-example');

    expect(result).toMatchSnapshot();
  });

  test('full example', async () => {
    const result = await processFixture('full-example');

    expect(result).toMatchSnapshot();
  });

  test('can be nested inside an admonition', async () => {
    const result = await processFixture('inside-admonition');

    expect(result).toMatchSnapshot();
  });

  test('respects file title', async () => {
    const result = await processFixture('file-title');

    expect(result).toMatchSnapshot();
  });

  test('does not re-import tabs components when already imported above', async () => {
    const result = await processFixture('import-tabs-above');

    expect(result).toMatchSnapshot();
  });

  test('does not re-import tabs components when already imported below', async () => {
    const result = await processFixture('import-tabs-below');

    expect(result).toMatchSnapshot();
  });
});
