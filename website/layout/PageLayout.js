/**
 * @providesModule PageLayout
 * @jsx React.DOM
 */

var React = require('React');
var Site = require('Site');
var Marked = require('Marked');

var support = React.createClass({
  render: function() {
    var metadata = this.props.metadata;
    var content = this.props.children;
    return (
      <Site section={metadata.section}>
        <div className="docMainWrapper wrapper">
          <Container className="mainContainer documentContainer postContainer">
            <Doc content={content} />
          </Container>
        </div>
      </Site>
    );
  }
});

module.exports = support;
