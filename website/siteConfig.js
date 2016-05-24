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
      <Button href="/jest/docs/getting-started.html#content">Get Started</Button>
      <Button href="/jest/docs/api.html#content">API Reference</Button>
    </div>,
  ],
  features: [
    {
      image: "/jest/img/content/adaptable.png",
      title: "Adaptable",
      content: "Jest uses Jasmine assertions by default and Jest is modular, extendible and configurable."
    },
    {
      image: "/jest/img/content/sandboxed.png",
      title: "Sandboxed and Fast",
      content: "Jest virtualizes JavaScript environments, provides browser mocks and runs tests in parallel across workers."
    },
    {
      image: "/jest/img/content/automatic_mocks.png",
      title: "Mock by Default",
      content: "Jest [automatically mocks](/jest/docs/automatic-mocking.html#content) JavaScript [modules](/jest/docs/common-js-testing.html#content), making most existing code testable."
    },
  ]
};

module.exports = siteConfig;
