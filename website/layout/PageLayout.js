/**
 * @providesModule PageLayout
 * @jsx React.DOM
 */

const React = require('React');
const Site = require('Site');
const Doc = require('Doc');
const Container = require('Container');

const support = React.createClass({
  render() {
    const metadata = this.props.metadata;
    const content = this.props.children;
    return (
      <Site section={metadata.section}>
        <div className="docMainWrapper wrapper">
          <Container className="mainContainer documentContainer postContainer">
            <Doc content={content} />
          </Container>
        </div>
      </Site>
    );
  },
});

module.exports = support;
