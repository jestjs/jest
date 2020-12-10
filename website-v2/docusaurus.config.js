/* eslint-disable sort-keys */

const path = require('path');

// The top-30 locales on Crowdin are enabled
// but we enable only a subset of those
const locales = [
  'en',
  'ja',
  //'ar',
  //'bs-BA',
  //'ca',
  //'cs',
  //'da',
  //'de',
  //'el',
  'es-ES',
  //'fa-IR',
  //'fi',
  //'fr',
  //'he',
  //'hu',
  //'id-ID',
  //'it',
  //'af',
  //'ko',
  //'mr-IN',
  //'nl',
  //'no-NO',
  //'pl',
  //'pt-PT',
  'pt-BR',
  'ro',
  'ru',
  //'sk-SK',
  //'sr',
  //'sv-SE',
  //'tr',
  'uk',
  //'vi',
  'zh-Hans',
  //'zh-Hant',
];

// TODO temporary
const LocaleToLabel = {
  en: 'English',
  ja: '日本語',
  'es-ES': 'Español',
  'pt-BR': 'Português (Brasil)',
  ro: 'Română',
  ru: 'Русский',
  uk: 'Українська',
  'zh-Hans': '简体中文',
};

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales,
  },
  title: 'Jest',
  titleDelimiter: '·',
  tagline: '🃏 Delightful JavaScript Testing',
  url: 'https://jestjs.io',
  baseUrl: '/',
  projectName: 'jest',
  favicon: 'img/favicon/favicon.ico',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          // homePageId: 'getting-started',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          editUrl: 'https://github.com/facebook/jest/edit/master/docs/',
          path: '../docs',
          sidebarPath: './sidebars.json',
        },
        blog: {
          path: path.join(__dirname, '..', 'website', 'blog'),
          blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: [
            path.resolve('src/components/v1/legacyCSS.css'),
            path.resolve('src/css/docusaurusTheme.css'),
            path.resolve('src/css/algoliaDocSearchTheme.css'),
            path.resolve('static/css/custom.css'),
            path.resolve('static/css/jest.css'),
          ],
        },
      },
    ],
  ],
  plugins: ['docusaurus-plugin-sass'],
  themeConfig: {
    navbar: {
      title: 'Jest',
      items: [
        // left items
        {
          type: 'docsVersionDropdown',
          position: 'left',
          dropdownActiveClassDisabled: true,
          dropdownItemsAfter: [
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
        {
          // TODO temporary
          to: 'https://jest-v2.netlify.app/',
          target: '_self',
          label: 'English',
          position: 'right',
          items: locales.map(locale => ({
            to: `https://jest-v2.netlify.app/${
              locale === 'en' ? '' : `${locale}/`
            }`,
            label: LocaleToLabel[locale] || locale,
            target: '_self',
          })),
        },
        {
          href: 'https://github.com/facebook/jest',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    image: 'img/opengraph.png',
    prism: {
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
              to: 'https://stackoverflow.com/questions/tagged/jestjs',
            },
            {
              label: 'Reactiflux',
              to: 'https://www.reactiflux.com',
            },
            {
              label: 'Twitter',
              to: 'https://twitter.com/fbjest',
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
              label: 'Github',
              to: 'https://github.com/facebook/jest',
            },
            {
              label: 'Twitter',
              to: 'https://twitter.com/fbjest',
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
        alt: 'Facebook Open Source Logo',
        src: 'img/oss_logo.png',
        href: 'https://opensource.facebook.com',
      },
      copyright: `Copyright © ${new Date().getFullYear()} Facebook, Inc. Built with Docusaurus.`,
    },
    algolia: {
      indexName: 'jest-v2',
      apiKey: '833906d7486e4059359fa58823c4ef56',
      contextualSearch: true,
    },
    gtag: {
      trackingID: 'UA-44373548-17',
    },
  },
};
