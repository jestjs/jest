/**
 * @providesModule ReferenceLayout
 * @jsx React.DOM
 */
 /* eslint-disable max-len */

const React = require('React');
const Site = require('Site');
const Container = require('Container');
const Doc = require('Doc');
const DocsSidebar = require('DocsSidebar');

const ReferenceLayout = React.createClass({
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
          <DocsSidebar language={this.props.language} metadata={metadata} title="API" root="/jest/docs/api.html" layout="reference" />
          <Container className="mainContainer referenceContainer">
            <Doc content={content} source={metadata.source} language={metadata.language}
              title={metadata.title} />
          </Container>
        </div>
      </Site>
    );
  },
});

module.exports = ReferenceLayout;
