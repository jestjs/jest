/**
 * @providesModule DocsLayout
 * @jsx React.DOM
 */
 /* eslint-disable max-len */

const React = require('React');
const Site = require('Site');
const Container = require('Container');
const Doc = require('Doc');
const DocsSidebar = require('DocsSidebar');

const siteConfig = require('../siteConfig.js');

const DocsLayout = React.createClass({
  render() {

    const metadata = this.props.metadata;
    const content = this.props.children;
    return (
      <Site
        className="sideNavVisible"
        section="docs"
        title={metadata.title}
        description={content.trim().split('\n')[0]}
        language={metadata.language}
        >
        <div className="docMainWrapper wrapper">
          <DocsSidebar metadata={metadata} />
          <Container className="mainContainer">
            <Doc content={content}
              source={metadata.source}
              title={siteConfig[this.props.metadata.language]['localized-strings'][this.props.metadata.localized_id]}
              language={metadata.language}
            />
            <div className="docs-prevnext">
              {metadata.previous && <a className="docs-prev button" href={stripLang(metadata.previous) + '.html#content'}>&larr; Previous</a>}
              {metadata.next && <a className="docs-next button" href={stripLang(metadata.next) + '.html#content'}>Continue Reading &rarr;</a>}
            </div>
          </Container>
        </div>
      </Site>
    );
  },
});

function stripLang(s) {
  return s.replace(/^[a-z]{2}-/, '');
}

module.exports = DocsLayout;
