/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const i18n = require('./i18n');
const ArchivedVersions = require('./archivedVersions.json');

const JestThemeColor = '#15c213';

const crowdinConfig = yaml.load(
  fs.readFileSync(path.resolve(__dirname, '../crowdin.yaml'), 'utf8')
);

const localeMapping = new Map(
  Object.entries(crowdinConfig.languages_mapping.locale).map(
    ([translation, locale]) => [locale, translation]
  )
);

/** @type {import('@docusaurus/types').Config} */
const config = {
  i18n,
  title: 'Jest',
  titleDelimiter: '·',
  tagline: '🃏 Delightful JavaScript Testing',
  url: 'https://jestjs.io',
  baseUrl: '/',
  organizationName: 'facebook',
  projectName: 'jest',
  favicon: 'img/favicon/favicon.ico',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // homePageId: 'getting-started',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          editUrl: ({locale, versionDocsDirPath, docPath}) => {
            const translation =
              locale === 'en' ? 'en' : localeMapping.get(locale) || locale;
            if (translation !== 'en') {
              return `https://crowdin.com/project/jest-v2/${translation}`;
            }
            return `https://github.com/jestjs/jest/edit/main/website/${versionDocsDirPath}/${docPath}`;
          },
          path: '../docs',
          sidebarPath: path.resolve(__dirname, './sidebars.json'),
          remarkPlugins: [
            [require('@docusaurus/remark-plugin-npm2yarn'), {sync: true}],
            require('docusaurus-remark-plugin-tab-blocks'),
          ],
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/jestjs/jest/tree/main/website/',
        },
        theme: {
          customCss: [
            path.resolve('src/css/docusaurusTheme.css'),
            path.resolve('src/css/algoliaDocSearchTheme.css'),
            path.resolve('src/components/v1/legacyCSS.css'),
            path.resolve('static/css/custom.css'),
            path.resolve('static/css/jest.css'),
            require.resolve(
              'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'
            ),
          ],
        },
        gtag: {
          trackingID: 'UA-44373548-17',
        },
        pages: {
          remarkPlugins: [
            [require('@docusaurus/remark-plugin-npm2yarn'), {sync: true}],
          ],
        },
      }),
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      /** @type {import('@docusaurus/plugin-client-redirects').Options} */
      ({
        // for legacy v1 Docusaurus site: /api.html => /api
        fromExtensions: ['html'],
      }),
    ],
    [
      '@docusaurus/plugin-pwa',
      /** @type {import('@docusaurus/plugin-pwa').Options} */
      ({
        pwaHead: [
          {
            tagName: 'link',
            rel: 'icon',
            href: 'img/jest.png',
          },
          {
            tagName: 'link',
            rel: 'manifest',
            href: 'manifest.json',
          },
          {
            tagName: 'meta',
            name: 'theme-color',
            content: '#FFF',
          },
          {
            tagName: 'meta',
            name: 'apple-mobile-web-app-capable',
            content: 'yes',
          },
          {
            tagName: 'meta',
            name: 'apple-mobile-web-app-status-bar-style',
            content: '#000',
          },
          {
            tagName: 'link',
            rel: 'apple-touch-icon',
            href: 'img/jest.png',
          },
          {
            tagName: 'link',
            rel: 'mask-icon',
            href: 'img/jest.svg',
            color: JestThemeColor,
          },
          {
            tagName: 'meta',
            name: 'msapplication-TileImage',
            content: 'img/jest.png',
          },
          {
            tagName: 'meta',
            name: 'msapplication-TileColor',
            content: '#000',
          },
        ],
      }),
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      announcementBar: {
        id: 'support_ukraine',
        content:
          'Support Ukraine 🇺🇦 <a target="_blank" rel="noopener noreferrer" href="https://opensource.facebook.com/support-ukraine"> Help Provide Humanitarian Aid to Ukraine</a>.',
        backgroundColor: '#20232a',
        textColor: '#fff',
        isCloseable: false,
      },
      docs: {
        sidebar: {
          hideable: true,
        },
      },
      navbar: {
        title: 'Jest',
        items: [
          // left items
          {
            type: 'docsVersionDropdown',
            position: 'left',
            dropdownActiveClassDisabled: true,
            dropdownItemsAfter: [
              ...Object.entries(ArchivedVersions).map(
                ([versionName, versionUrl]) => ({
                  href: versionUrl,
                  label: versionName,
                })
              ),
              {
                to: '/versions',
                label: 'All versions',
              },
            ],
          },
          // right items
          {
            label: 'Docs',
            type: 'doc',
            docId: 'getting-started',
            position: 'right',
          },
          {
            label: 'API',
            type: 'doc',
            docId: 'api',
            position: 'right',
          },
          {
            to: '/help',
            label: 'Help',
            position: 'right',
          },
          {to: 'blog', label: 'Blog', position: 'right'},
          {type: 'localeDropdown', position: 'right'},
          {
            href: 'https://github.com/jestjs/jest',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
          },
        ],
      },
      image: 'img/opengraph.png',
      prism: {
        additionalLanguages: ['bash', 'diff', 'json'],
        theme: require('./src/prism/themeLight'),
        darkTheme: require('./src/prism/themeDark'),
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/getting-started',
              },
              {
                label: 'Guides',
                to: '/docs/snapshot-testing',
              },
              {
                label: 'API Reference',
                to: '/docs/api',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/jestjs',
              },
              {
                label: 'Reactiflux',
                href: 'https://www.reactiflux.com',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/jestjs_',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/jestjs/jest',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/jestjs_',
              },
            ],
          },
          {
            title: 'Legal',
            items: [
              {
                label: 'Privacy',
                href: 'https://opensource.facebook.com/legal/privacy/',
              },
              {
                label: 'Terms',
                href: 'https://opensource.facebook.com/legal/terms/',
              },
            ],
          },
        ],
        logo: {
          //         src: 'img/jest-outline.svg',
          alt: 'OpenJS Foundation Logo',
          src: 'img/openjs_foundation-logo-horizontal-color-dark_background.svg',
          href: 'https://openjsf.org/',
        },
        copyright: `<p>Copyright <a href="https://openjsf.org">OpenJS Foundation</a> and Jest contributors. All rights reserved. The <a href="https://openjsf.org">OpenJS Foundation</a> has registered trademarks and uses trademarks.  For a list of trademarks of the <a href="https://openjsf.org">OpenJS Foundation</a>, please see our <a href="https://trademark-policy.openjsf.org">Trademark Policy</a> and <a href="https://trademark-list.openjsf.org">Trademark List</a>.  Trademarks and logos not indicated on the <a href="https://trademark-list.openjsf.org">list of OpenJS Foundation trademarks</a> are trademarks&trade; or registered&reg; trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.</p>
<p><a href="https://openjsf.org">The OpenJS Foundation</a> | <a href="https://terms-of-use.openjsf.org">Terms of Use</a> | <a href="https://privacy-policy.openjsf.org">Privacy Policy</a> | <a href="https://bylaws.openjsf.org">Bylaws</a> | <a href="https://code-of-conduct.openjsf.org">Code of Conduct</a> | <a href="https://trademark-policy.openjsf.org">Trademark Policy</a> | <a href="https://trademark-list.openjsf.org">Trademark List</a> | <a href="https://www.linuxfoundation.org/cookies">Cookie Policy</a></p>Built with Docusaurus.`,
      },
      algolia: {
        indexName: 'jest-v2',
        appId: 'HP439UUSOL',
        apiKey: 'e5e670fd16f8f17caada79d6b0931682',
        contextualSearch: true,
      },
    }),
};

module.exports = config;
