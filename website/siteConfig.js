/* eslint-disable sort-keys, max-len */

const Button = require('Button');
const React = require('React');

const githubButton = <a className="github-button" href="https://github.com/facebook/jest" data-icon="octicon-star" data-count-href="/facebook/jest/stargazers" data-count-api="/repos/facebook/jest#stargazers_count" data-count-aria-label="# stargazers on GitHub" aria-label="Star facebook/jest on GitHub">Star</a>;
const siteConfig = {
  title: 'Jest',
  tagline: '🃏 Painless JavaScript Testing',
  description: 'Jest is a JavaScript testing framework, used by Facebook to test all JavaScript code including React applications.',
  url: 'https://facebook.github.io',
  baseUrl: '/jest/',
  repo: 'facebook/jest',
  githubButton,
  homepagePromos: [
    <div className="pluginRowBlock">
      <Button href="#use">Try out Jest</Button>
      <Button href="/jest/docs/getting-started.html">Get Started</Button>
      <Button href="/jest/docs/snapshot-testing.html">Learn More</Button>
    </div>,
  ],
  topFeatures: [
    {
      image: '/jest/img/content/female-technologist.png',
      imageAlign: 'top',
      title: 'Easy Setup',
      content: 'Jest is a complete and easy to set up JavaScript testing solution. In fact, Jest works out of the box for any React project.',
    },
    {
      image: '/jest/img/content/runner.png',
      imageAlign: 'top',
      title: 'Instant Feedback',
      content: 'Failed tests run first. Fast interactive mode can switch between running all tests or only test files related to changed files.',
    },
    {
      image: '/jest/img/content/camera-with-flash.png',
      imageAlign: 'top',
      title: 'Snapshot Testing',
      content: 'Jest can capture snapshots of React trees or other serializable values to simplify UI testing.',
    },
  ],
  features: [
    {
      content: 'Jest is already configured when you use `create-react-app` or `react-native init` to create your React and React Native projects. Place your tests in a `__tests__` folder, or name your test files with a `.spec.js` or `.test.js` extension. Whatever you prefer, Jest will find and run your tests.',
      image: 'img/content/feature-snapshot-tests.png',
      imageAlign: 'right',
      title: 'Zero configuration',
    },
    {
      content: 'Easily create code coverage reports using `--coverage`. No additional setup or libraries needed! Jest can collect code coverage information from entire projects, including untested files.',
      image: 'img/content/feature-pattern-mode.png',
      imageAlign: 'left',
      title: 'Built-in code coverage reports',
    },
    {
      content: 'Sandboxed test files and automatic global state resets for every test. Jest parallelizes test runs across workers to maximize performance. Console messages are buffered and printed together with test results.',
      image: 'img/content/feature-snapshot-tests.png',
      imageAlign: 'right',
      title: 'Sandboxed and fast',
    },
    {
      content: 'Powerful [mocking library](/jest/docs/mock-functions.html) for functions and modules. Mock React Native components using `jest-react-native`.',
      image: 'img/content/feature-pattern-mode.png',
      imageAlign: 'left',
      title: 'Powerful mocking library',
    },
    {
      content: 'Jest works with any compile-to-JavaScript language and integrates seamlessly with [Babel](https://babeljs.io).',
      image: 'img/content/feature-snapshot-tests.png',
      imageAlign: 'right',
      title: 'Works with TypeScript',
    },
    {
      content: 'Run your tests within a fake DOM implementation (via [jsdom](https://github.com/tmpvar/jsdom)) on the command line. Every DOM API that you call can be observed in the same way it would be observed in a browser.',
      image: 'img/content/feature-pattern-mode.png',
      imageAlign: 'left',
      title: 'Simulated DOM environment',
    },
  ],
  users: [
    {
      caption: 'Facebook',
      image: 'img/logos/facebook.png',
      infoLink: 'https://code.facebook.com',
      pinned: true,
    },
    {
      caption: 'Oculus',
      image: 'img/logos/oculus.png',
      infoLink: 'https://www.oculus.com/',
      pinned: true,
    },
    {
      caption: 'Instagram',
      image: 'img/logos/instagram.png',
      infoLink: 'https://www.instagram.com/',
      pinned: true,
    },
    {
      caption: 'Twitter',
      image: 'img/logos/twitter.png',
      infoLink: 'https://www.twitter.com',
      pinned: true,
    },
    {
      caption: 'Pinterest',
      image: 'img/logos/pinterest.png',
      infoLink: 'https://www.pinterest.com',
      pinned: true,
    },
    {
      caption: 'The New York Times',
      image: 'img/logos/nyt.png',
      infoLink: 'http://www.nytimes.com/',
      pinned: true,
    },
    {
      caption: 'IBM',
      image: 'img/logos/ibm.png',
      infoLink: 'http://www.ibm.com/',
    },
    {
      caption: 'ebay',
      image: 'img/logos/ebay.png',
      infoLink: 'http://www.ebay.com/',
    },
    {
      caption: 'PayPal',
      image: 'img/logos/paypal.png',
      infoLink: 'https://www.paypal.com',
    },
    {
      caption: 'Spotify',
      image: 'img/logos/spotify.png',
      infoLink: 'https://www.spotify.com',
    },
    {
      caption: 'Target',
      image: 'img/logos/target.png',
      infoLink: 'http://www.target.com',
    },
    {
      caption: 'Intuit',
      image: 'img/logos/intuit.png',
      infoLink: 'https://www.intuit.com/',
    },
    {
      caption: 'Cisco',
      image: 'img/logos/cisco.png',
      infoLink: 'http://www.cisco.com/',
    },
    {
      caption: 'Artsy',
      image: 'img/logos/artsy.png',
      infoLink: 'https://www.artsy.net/',
    },
    {
      caption: 'Automattic',
      image: 'img/logos/automattic.png',
      infoLink: 'https://automattic.com/',
    },
    {
      caption: 'Coinbase',
      image: 'img/logos/coinbase.png',
      infoLink: 'https://www.coinbase.com/',
    },
    {
      caption: 'Discord',
      image: 'img/logos/discord.png',
      infoLink: 'https://discordapp.com/',
    },
    {
      caption: 'Egghead',
      image: 'img/logos/egghead.png',
      infoLink: 'https://egghead.io/',
    },
    {
      caption: 'Elastic',
      image: 'img/logos/elastic.png',
      infoLink: 'https://www.elastic.co/',
    },
    {
      caption: 'Formidable',
      image: 'img/logos/formidablelabs.png',
      infoLink: 'http://formidable.com/',
    },
    {
      caption: 'Globo',
      image: 'img/logos/globo.png',
      infoLink: 'http://www.globo.com/',
    },
    {
      caption: 'Intercom',
      image: 'img/logos/intercom.png',
      infoLink: 'https://www.intercom.com/',
    },
    {
      caption: 'KLM Royal Dutch Airlines',
      image: 'img/logos/klm.png',
      infoLink: 'https://www.klm.com/',
    },
    {
      caption: 'Quiqup',
      image: 'img/logos/quiqup.png',
      infoLink: 'https://www.quiqup.com/',
    },
    {
      caption: 'Reddit',
      image: 'img/logos/reddit.png',
      infoLink: 'https://www.reddit.com/',
    },
    {
      caption: 'SeatGeek',
      image: 'img/logos/seatgeek.png',
      infoLink: 'https://seatgeek.com/',
    },
    {
      caption: 'SoundCloud',
      image: 'img/logos/soundcloud.png',
      infoLink: 'https://soundcloud.com/',
    },
    {
      caption: 'Trivago',
      image: 'img/logos/trivago.png',
      infoLink: 'http://www.trivago.com/',
    },
    {
      caption: 'Xing',
      image: 'img/logos/xing.png',
      infoLink: 'https://www.xing.com/',
    },
    {
      caption: 'WOW air',
      image: 'img/logos/wowair.png',
      infoLink: 'https://wowair.com/',
    },
  ],
};

module.exports = siteConfig;
