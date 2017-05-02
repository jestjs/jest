/**
 * @providesModule HeaderNav
 * @jsx React.DOM
 */

/* eslint-disable sort-keys */

const React = require('React');

class HeaderNav extends React.Component {
  constructor() {
    super();
    this.state = {
      slideoutActive: false,
    };
  }

  makeLinks(link) {
    return (
      <li key={link.section}>
        <a
          href={link.href}
          className={link.section === this.props.section ? 'active' : ''}>
          {link.text}
        </a>
      </li>
    );
  }

  render() {
    return (
      <div className="fixedHeaderContainer">
        <div className="headerWrapper wrapper">
          <header>
            <a href={this.props.baseUrl}>
              <img src={this.props.baseUrl + 'img/jest-outline.svg'} />
              <h2>{this.props.title}</h2>
            </a>
            {this.renderResponsiveNav()}
          </header>
        </div>
      </div>
    );
  }

  renderResponsiveNav() {
    return (
      <div className="navigationWrapper navigationSlider">
        <nav className="slidingNav">
          <ul className="nav-site nav-site-internal">
            {this.props.linksInternal.map(this.makeLinks, this)}
            <li className="navSearchWrapper reactNavSearchWrapper">
              <input id="search_input_react" type="text" placeholder="Search" />
            </li>
            {this.props.linksExternal.map(this.makeLinks, this)}
          </ul>
        </nav>
      </div>
    );
  }
}

HeaderNav.defaultProps = {
  linksInternal: [
    {section: 'docs', href: '/jest/docs/getting-started.html', text: 'Docs'},
    {section: 'api', href: '/jest/docs/api.html', text: 'API'},
    {section: 'help', href: '/jest/help.html', text: 'Help'},
    {section: 'blog', href: '/jest/blog/', text: 'Blog'},
  ],
  linksExternal: [
    {section: 'github', href: 'https://github.com/facebook/jest', text: 'GitHub'},
  ],
};

module.exports = HeaderNav;
