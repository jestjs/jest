var Button = require('Button');

var githubButton = <a className="github-button" href="https://github.com/facebook/jest" data-icon="octicon-star" data-style="mega" data-count-href="/facebook/jest/stargazers" data-count-api="/repos/facebook/jest#stargazers_count" data-count-aria-label="# stargazers on GitHub" aria-label="Star facebook/jest on GitHub">Star</a>;
var siteConfig = {
  title: "Jest",
  tagline: "Painless JavaScript Testing",
  description: "Jest is a JavaScript testing framework, used by Facebook to test all JavaScript code including React applications.",
  url: "https://facebook.github.io",
  baseUrl: "/jest/",
  repo: "facebook/jest",
  githubButton: githubButton,
  homepagePromos: [
    <div className="pluginRowBlock">
      <Button href="/jest/docs/getting-started.html">Get Started</Button>
      <Button href="/jest/docs/snapshot-testing.html">Snapshot Testing</Button>
      <Button href="/jest/docs/api.html">API Reference</Button>
      {githubButton}
    </div>,
  ],
  features: [
    {
      image: "/jest/img/content/adaptable.svg",
      title: "Easy and Familiar",
      content: "Jest is a complete and easy to setup JavaScript testing solution."
    },
    {
      image: "/jest/img/content/sandboxed.svg",
      title: "Performance",
      content: "Jest virtualizes JavaScript environments and runs tests in parallel across worker processes."
    },
    {
      image: "/jest/img/content/snapshots.svg",
      title: "Snapshot Testing",
      content: "Jest can [capture snapshots](/jest/docs/snapshot-testing.html) of React trees or other serializable values to simplify UI testing."
    },
  ]
};

module.exports = siteConfig;
