/**
 * @providesModule center
 * @jsx React.DOM
 */

var React = require('React');

var assign = require('object-assign');

var center = React.createClass({
  render: function() {
    var {style, ...props} = this.props;
    style = assign({}, style, {textAlign: 'center'});

    return (
      <div {...props} style={style}>{this.props.children}</div>
    );
  }
});

module.exports = center;
