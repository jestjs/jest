/* eslint-disable sort-keys, max-len */

const Button = require('Button');
const React = require('React');

const githubButton = <a className="github-button" href="https://github.com/facebook/jest" data-icon="octicon-star" data-style="mega" data-count-href="/facebook/jest/stargazers" data-count-api="/repos/facebook/jest#stargazers_count" data-count-aria-label="# stargazers on GitHub" aria-label="Star facebook/jest on GitHub">Star</a>;
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
      <Button href="#getting-started">Get Started</Button>
      <Button href="/jest/docs/snapshot-testing.html">Snapshot Testing</Button>
      <Button href="/jest/docs/api.html">API Reference</Button>
    </div>,
  ],
  features: [
    {
      image: '/jest/img/content/adaptable.svg',
      title: 'Turbocharged',
      content: 'Jest is a complete and easy to setup JavaScript testing solution.',
    },
    {
      image: '/jest/img/content/sandboxed.svg',
      title: 'Instant Feedback',
      content: 'Fast interactive mode and built-in coverage.',
    },
    {
      image: '/jest/img/content/snapshots.svg',
      title: 'Snapshot Testing',
      content: 'Jest can [capture snapshots](/jest/docs/tutorial-react.html#snapshot-testing) of React trees or other serializable values to simplify UI testing.',
    },
  ],
};

module.exports = siteConfig;
