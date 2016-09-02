var Button = require('Button');

var siteConfig = {
  title: "Jest",
  tagline: "Painless JavaScript Unit Testing",
  description: "Jest is a JavaScript unit testing framework, used by Facebook to test services and React applications.",
  url: "https://facebook.github.io",
  baseUrl: "/jest/",
  repo: "facebook/jest",
  homepagePromos: [
    <div className="pluginRowBlock">
      <Button href="#getting-started">Get Started</Button>
      <Button href="/jest/docs/api.html#content">API Reference</Button>
    </div>,
  ],
  features: [
    {
      image: "/jest/img/content/adaptable.svg",
      title: "Adaptable",
      content: "Jest uses Jasmine assertions by default and Jest is modular, extendible and configurable."
    },
    {
      image: "/jest/img/content/sandboxed.svg",
      title: "Sandboxed and Fast",
      content: "Jest virtualizes JavaScript environments, provides browser mocks and runs tests in parallel across workers."
    },
    {
      image: "/jest/img/content/snapshots.svg",
      title: "Snapshot Testing",
      content: "Jest can [capture snapshots](/jest/docs/tutorial-react.html#snapshot-testing) of React trees or other serializable values to write tests quickly and it provides a seamless update experience."
    },
  ]
};

module.exports = siteConfig;
