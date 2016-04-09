/**
 * @providesModule DocsLayout
 * @jsx React.DOM
 */

var React = require('React');
var Site = require('Site');
var Marked = require('Marked');
var DocsSidebar = require('DocsSidebar');
var DocsLayout = React.createClass({
  render: function() {
    var metadata = this.props.metadata;
    var content = this.props.children;
    return (
      <Site
        section="docs"
        title={metadata.title}
        description={content.trim().split('\n')[0]}>
        <section className="content wrap documentationContent">
          <DocsSidebar metadata={metadata} />
          <div className="inner-content">
            <a id="content" />
            <a className="edit-page-link" href={'https://github.com/facebook/jest/blob/master/docs/' + metadata.source} target="_blank">Edit on GitHub</a>
            <h1>{metadata.title}</h1>
            <Marked>{content}</Marked>
            <div className="docs-prevnext">
              {metadata.previous && <a className="docs-prev" href={metadata.previous + '.html#content'}>&larr; Prev</a>}
              {metadata.next && <a className="docs-next" href={metadata.next + '.html#content'}>Next &rarr;</a>}
            </div>
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = DocsLayout;
