/**
 * @providesModule DocsLayout
 * @jsx React.DOM
 */

var React = require('React');
var Site = require('Site');
var Marked = require('Marked');
var Container = require('Container');
var Doc = require('Doc');
var DocsSidebar = require('DocsSidebar');

var DocsLayout = React.createClass({
  render: function() {
    var metadata = this.props.metadata;
    var content = this.props.children;
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
  }
});

module.exports = DocsLayout;
