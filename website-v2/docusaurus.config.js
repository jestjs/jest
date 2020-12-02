/* eslint-disable sort-keys */

const path = require('path');

module.exports = {
  title: 'Jest',
  tagline: '🃏 Delightful JavaScript Testing',
  url: 'https://jestjs.io',
  baseUrl: '/',
  projectName: 'jest',
  scripts: [
    'https://buttons.github.io/buttons.js',
    'https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js',
    '/js/code-block-buttons.js',
  ],
  stylesheets: ['/css/code-block-buttons.css'],
  favicon: 'img/favicon/favicon.ico',
  customFields: {
    repo: 'facebook/jest',
    users: [
      {
        caption: 'Facebook',
        image: '/img/logos/facebook.png',
        infoLink: 'https://code.facebook.com',
      },
      {
        caption: 'Twitter',
        image: '/img/logos/twitter.png',
        infoLink: 'https://www.twitter.com',
      },
      {
        caption: 'The New York Times',
        image: '/img/logos/nyt.png',
        infoLink: 'http://www.nytimes.com/',
      },
      {
        caption: 'Spotify',
        image: '/img/logos/spotify.png',
        infoLink: 'https://www.spotify.com',
      },
      {
        caption: 'Airbnb',
        image: '/img/logos/airbnb.png',
        infoLink: 'https://www.airbnb.com/',
      },
      {
        caption: 'Instagram',
        image: '/img/logos/instagram.png',
        infoLink: 'https://www.instagram.com/',
      },
    ],
    videos: [
      {
        title: 'Rogelio Guzman - Jest Snapshots and Beyond - React Conf 2017',
        type: 'youtube',
        url: 'https://www.youtube.com/embed/HAuXJVI_bUs',
        description:
          '[Rogelio](https://twitter.com/rogeliog) shows how Jest might help you overcome the inertia to write & maintain tests with the help of a simple React Application.',
      },
      {
        title:
          'Aaron Abramov – Establishing Testing Patterns with Software Design Principles',
        type: 'youtube',
        url: 'https://www.youtube.com/embed/_pnW-JjmyXE',
        description:
          '[Aaron](https://twitter.com/aaronabramov_) shows how the lack of clarity about testing applications leads engineers to write low-quality tests that don’t catch bugs, break unnecessarily, and are hard to write.',
      },
      {
        title: 'Snapshot testing - Anna Doubkova, React London 2017',
        type: 'youtube',
        url: 'https://www.youtube.com/embed/sCbGfi40IWk',
        description:
          'In this talk, [Anna Doubkova](https://twitter.com/lithinn) explains Snapshot Testing in brief while also highlighting testing pitfalls.',
      },
      {
        title: 'Test React applications using Enzyme & Jest',
        type: 'youtube',
        url: 'https://www.youtube.com/embed/8Ww2QBVIw0I',
        description:
          'This talk by [Ryan Walsh](https://twitter.com/_rtwalsh) gives an introduction to testing [React](https://facebook.github.io/react/) components using [Enzyme](http://airbnb.io/enzyme/) and Jest.',
      },
    ],
    videoTypes: {
      YOUTUBE: 'youtube',
      IFRAME: 'iframe',
    },
    recruitingLink: 'https://crowdin.com/project/jest',
    repoUrl: 'https://github.com/facebook/jest',
    siteConfigUrl:
      'https://github.com/facebook/jest/edit/master/website/siteConfig.js',
  },
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
          sidebarPath: '../website/sidebars.json',
        },
        blog: {
          path: path.join(__dirname, '..', 'website', 'blog'),
          blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: [
            path.resolve('src/components/v1/legacyCSS.css'),
            path.resolve('src/css/customTheme.css'),
            path.resolve('static/css/custom.css'),
            path.resolve('static/css/jest.css'),
            path.resolve('static/css/hljs-jest.css'),
          ],
        },
      },
    ],
  ],
  plugins: ['docusaurus-plugin-sass'],
  themeConfig: {
    navbar: {
      title: 'Jest',
      logo: {
        src: 'img/jest.svg',
      },
      items: [
        {
          to: 'docs/getting-started',
          label: 'Docs',
          position: 'left',
        },
        {
          to: 'docs/api',
          label: 'API',
          position: 'left',
        },
        {to: 'blog', label: 'Blog', position: 'left'},
        {
          to: '/help',
          label: 'Help',
          position: 'left',
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownItemsAfter: [
            {
              to: '/versions',
              label: 'All versions',
            },
          ],
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
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/',
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
