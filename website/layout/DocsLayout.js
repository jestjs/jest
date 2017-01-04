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

const DocsLayout = React.createClass({
  render() {
    const metadata = this.props.metadata;
    const content = this.props.children;
    return (
      <Site
        className="sideNavVisible"
        section="docs"
        title={metadata.title}
        description={content.trim().split('\n')[0]}>
        <div className="docMainWrapper wrapper">
          <DocsSidebar metadata={metadata} />
          <Container className="mainContainer documentContainer postContainer">
            <Doc content={content} source={metadata.source} title={metadata.title} />
            <div className="docs-prevnext">
              {metadata.previous && <a className="docs-prev" href={metadata.previous + '.html#content'}>&larr; Prev</a>}
              {metadata.next && <a className="docs-next" href={metadata.next + '.html#content'}>Next &rarr;</a>}
            </div>
          </Container>
        </div>
      </Site>
    );
  },
});

module.exports = DocsLayout;
