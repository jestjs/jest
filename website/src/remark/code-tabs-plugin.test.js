/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('node:path');
const fs = require('graceful-fs');
const remarkMdx = require('remark-mdx');
const remark = require('remark');
const codeTabsPlugin = require('./code-tabs-plugin');

async function processFixture(fixture) {
  const filePath = path.join(__dirname, '__fixtures__', `${fixture}.md`);
  const file = fs.readFileSync(filePath);

  const result = await remark()
    .use(remarkMdx)
    .use(codeTabsPlugin)
    .process(file);

  return result.toString();
}

describe('code tabs plugin', () => {
  test('base example', async () => {
    const result = await processFixture('base');

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

  test('respects title meta', async () => {
    const result = await processFixture('title');

    expect(result).toMatchSnapshot();
  });

  test('supports span meta', async () => {
    const result = await processFixture('span');

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
