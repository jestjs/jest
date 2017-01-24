/**
 * @providesModule Footer
 * @jsx React.DOM
 */

const React = require('React');

const githubButton = <a className="github-button" href="https://github.com/facebook/jest" data-icon="octicon-star" data-count-href="/facebook/jest/stargazers" data-count-api="/repos/facebook/jest#stargazers_count" data-count-aria-label="# stargazers on GitHub" aria-label="Star facebook/jest on GitHub">Star</a>;

class Footer extends React.Component {
  render() {
    const currentYear = (new Date()).getFullYear();
    return (
      <footer className="nav-footer">
        <section className="sitemap">
          <a href="/jest" className="nav-home">
            <img src="/jest/img/jest-outline.svg" alt="Jest" width="66"
              height="58" />
          </a>
          <div>
            <h5>Docs</h5>
            <a href="/jest/docs/getting-started.html">Getting Started</a>
            <a href="/jest/docs/snapshot-testing.html">Guides</a>
            <a href="/jest/docs/api.html">API Reference</a>
          </div>
          <div>
            <h5>Community</h5>
            <a href="/jest/users.html">Who's Using Jest?</a>
            <a href="http://stackoverflow.com/questions/tagged/jestjs" target="_blank">Stack Overflow</a>
            <a href="https://discordapp.com/channels/102860784329052160/103622435865104384">Jest Chat</a>
            <a href="https://twitter.com/fbjest" target="_blank">Twitter</a>
          </div>
          <div>
            <h5>More</h5>
            <a href="/jest/blog">Blog</a>
            <a href="https://github.com/facebook/jest">GitHub</a>
            {githubButton}
          </div>
        </section>

        <a href="https://code.facebook.com/projects/" target="_blank" className="fbOpenSource">
          <img src="/jest/img/oss_logo.png"
            alt="Facebook Open Source" width="170" height="45"/>
        </a>
        <section className="copyright">
          Copyright © {currentYear} Facebook Inc.
        </section>
      </footer>
    );
  }
}

module.exports = Footer;
