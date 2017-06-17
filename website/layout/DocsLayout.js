/**
 * @providesModule DocsLayout
 * @jsx React.DOM
 */

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
        title={
          siteConfig[this.props.metadata.language]['localized-strings'][
            this.props.metadata.localized_id
          ]
        }
        description={content.trim().split('\n')[0]}
        language={metadata.language}
      >
        <div className="docMainWrapper wrapper">
          <DocsSidebar metadata={metadata} />
          <Container className="mainContainer">
            <Doc
              content={content}
              source={metadata.source}
              title={
                siteConfig[this.props.metadata.language]['localized-strings'][
                  this.props.metadata.localized_id
                ]
              }
              language={metadata.language}
            />
            <div className="docs-prevnext">
              {metadata.previous_id &&
                <a
                  className="docs-prev button"
                  href={metadata.previous_id + '.html#content'}
                >
                  ←
                  {' '}
                  {
                    siteConfig[this.props.metadata.language][
                      'localized-strings'
                    ]['previous']
                  }
                </a>}
              {metadata.next_id &&
                <a
                  className="docs-next button"
                  href={metadata.next_id + '.html#content'}
                >
                  {
                    siteConfig[this.props.metadata.language][
                      'localized-strings'
                    ]['next']
                  }
                  {' '}
                  →
                </a>}
            </div>
          </Container>
        </div>
      </Site>
    );
  },
});
module.exports = DocsLayout;
