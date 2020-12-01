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
  onBrokenLinks: 'log',
  onBrokenMarkdownLinks: 'log',
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          homePageId: 'getting-started',
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
          customCss: '../src/css/customTheme.css',
        },
      },
    ],
  ],
  plugins: [],
  themeConfig: {
    navbar: {
      title: 'Jest',
      logo: {
        src: 'img/jest.svg',
      },
      items: [
        {
          to: 'docs/',
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
          href: 'https://github.com/facebook/jest',
          label: 'GitHub',
          position: 'left',
        },
        {
          label: 'Version',
          to: 'docs',
          position: 'right',
          items: [
            {
              label: '26.6',
              to: 'docs/',
              activeBaseRegex:
                'docs/(?!22.x|23.x|24.x|25.x|26.0|26.2|26.4|26.5|26.6|next)',
            },
            {
              label: '26.5',
              to: 'docs/26.5/',
            },
            {
              label: '26.4',
              to: 'docs/26.4/',
            },
            {
              label: '26.2',
              to: 'docs/26.2/',
            },
            {
              label: '26.0',
              to: 'docs/26.0/',
            },
            {
              label: '25.x',
              to: 'docs/25.x/',
            },
            {
              label: '24.x',
              to: 'docs/24.x/',
            },
            {
              label: '23.x',
              to: 'docs/23.x/',
            },
            {
              label: '22.x',
              to: 'docs/22.x/',
            },
            {
              label: 'Master/Unreleased',
              to: 'docs/next/',
              activeBaseRegex: 'docs/next/(?!support|team|resources)',
            },
          ],
        },
      ],
    },
    image: 'img/opengraph.png',
    footer: {
      links: [
        {
          title: 'Community',
          items: [
            {
              label: 'Twitter',
              to: 'https://twitter.com/fbjest',
            },
          ],
        },
      ],
      logo: {
        src: 'img/jest-outline.svg',
      },
    },
    algolia: {
      indexName: 'jest',
      // apiKey: process.env.ALGOLIA_JEST_API_KEY,
      apiKey: '47ecd3b21be71c5822571b9f59e52544',
      /*
      algoliaOptions: {
        facetFilters: ['language:LANGUAGE', 'version:VERSION'],
      },
       */
    },
    gtag: {
      trackingID: 'UA-44373548-17',
    },
  },
};
