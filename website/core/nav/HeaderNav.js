/**
 * @providesModule HeaderNav
 * @jsx React.DOM
 */

/* eslint-disable sort-keys */

const React = require('React');

const siteConfig = require('../../siteConfig.js');

class LanguageDropDown extends React.Component {
  render() {
    const enabledLanguages = [];
    let currentLanguage = 'English';

    siteConfig['languages'].map(lang => {
      if (lang.tag == this.props.language) {
        currentLanguage = lang.name;
      }
      if (lang.tag == this.props.language) {
        return;
      }
      enabledLanguages.push(
        <li key={lang.tag}>
          <a href={'/jest/' + lang.tag}>
            {lang.name}
          </a>
        </li>,
      );
    });

    enabledLanguages.push(
      <li key="recruiting">
        <a href="https://crowdin.com/project/jest" target="_blank">
          Help Translate
        </a>
      </li>,
    );

    return (
      <span>
        <li>
          <a id="languages-menu" href="#">
            <img
              className="languages-icon"
              src={this.props.baseUrl + 'img/language.svg'}
            />
            {currentLanguage}
          </a>
          <div id="languages-dropdown" className="hide">
            <ul id="languages-dropdown-items">
              {enabledLanguages}
            </ul>
          </div>
        </li>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        const languagesMenuItem = document.getElementById("languages-menu");
        const languagesDropDown = document.getElementById("languages-dropdown");
        languagesMenuItem.addEventListener("click", function(){
          if(languagesDropDown.className == "hide") {
            languagesDropDown.className = "visible";
          } else {
            languagesDropDown.className = "hide";
          }
        });
      `,
          }}
        />
      </span>
    );
  }
}

class HeaderNav extends React.Component {
  constructor() {
    super();
    this.state = {
      slideoutActive: false,
    };
  }

  makeLinks(link) {
    link.href = link.href.replace(
      /\/LANGUAGE\//,
      '/' + this.props.language + '/',
    );
    return (
      <li key={link.section}>
        <a
          href={link.href}
          className={link.section === this.props.section ? 'active' : ''}
        >
          {siteConfig[this.props.language]['localized-strings'][link.text]}
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
              <h2>
                {this.props.title}
              </h2>
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
            <LanguageDropDown
              baseUrl={this.props.baseUrl}
              language={this.props.language}
            />
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
    {
      section: 'docs',
      href: '/jest/docs/LANGUAGE/getting-started.html',
      text: 'Docs',
    },
    {section: 'api', href: '/jest/docs/LANGUAGE/api.html', text: 'API'},
    {section: 'help', href: '/jest/LANGUAGE/help.html', text: 'Help'},
    {section: 'blog', href: '/jest/blog/', text: 'Blog'},
  ],
  linksExternal: [
    {
      section: 'github',
      href: 'https://github.com/facebook/jest',
      text: 'GitHub',
    },
  ],
};

module.exports = HeaderNav;
