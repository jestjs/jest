/* eslint-disable sort-keys */
const fs = require('fs-extra');
const globby = require('globby');

/*
Unfortunately, some Crowdin downloaded translations (md files) are malformed.

Due to the MDX parser of Docusaurus 2,
these malformed translated md docs make the builds fail

This is a temporary workaround solution to fix the malformed docs
emitted by Crowdin and ensure we are able to build the localized sites!

This has been reported to Crowdin, hopefully they'll fix this.
 */
const translationFixes = [
  {
    filesGlob:
      './i18n/es-ES/docusaurus-plugin-content-docs/*/Troubleshooting.md',
    stringBefore: 'código que mueve code>import</code>',
    stringAfter: 'código que mueve `import`',
  },
  {
    filesGlob: './i18n/zh-Hans/docusaurus-plugin-content-docs/*/CLI.md',
    stringBefore: '```\n\n</code>',
    stringAfter: '```',
  },
  {
    filesGlob:
      './i18n/pt-BR/docusaurus-plugin-content-docs/*/BypassingModuleMocks.md',
    stringBefore: '```\n;\n</code>',
    stringAfter: '```',
  },
];

async function applyTranslationFix(translationFix) {
  const {filesGlob, stringBefore, stringAfter} = translationFix;
  const files = await globby(filesGlob);
  console.log('\n');
  console.log('applyTranslationFix', {...translationFix, files});

  for (const file of files) {
    const fileContent = await fs.readFile(file, 'utf8');

    if (fileContent.includes(stringBefore)) {
      console.log(
        `String [${stringBefore}] found! - > replacing it by [${stringAfter}] in file [${file}]`,
      );
      const fileContentUpdated = fileContent.replace(stringBefore, stringAfter);
      await fs.writeFile(file, fileContentUpdated, 'utf8');
    }
  }
}

async function run() {
  // run sequentially for now
  for (const translationFix of translationFixes) {
    await applyTranslationFix(translationFix);
  }
}

run();
