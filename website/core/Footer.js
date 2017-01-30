/**
 * @providesModule Footer
 * @jsx React.DOM
 */

const React = require('React');
const siteConfig = require('../siteConfig.js');

class Footer extends React.Component {
  render() {
    const currentYear = (new Date()).getFullYear();
    return (
      <footer className="nav-footer" id="footer">
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
            <a href="/jest/users.html">User Showcase</a>
            <a href="http://stackoverflow.com/questions/tagged/jestjs" target="_blank">Stack Overflow</a>
            <a href="https://discordapp.com/channels/102860784329052160/103622435865104384">Jest Chat</a>
            <a href="https://twitter.com/fbjest" target="_blank">Twitter</a>
          </div>
          <div>
            <h5>More</h5>
            <a href="/jest/blog">Blog</a>
            <a href="https://github.com/facebook/jest">GitHub</a>
            {siteConfig.githubButton}
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
