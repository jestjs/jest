/**
 * @providesModule center
 * @jsx React.DOM
 */

const React = require('React');

const assign = require('object-assign');

const center = React.createClass({
  render() {
    let {style, ...props} = this.props;
    style = assign({}, style, {textAlign: 'center'});

    return (
      <div {...props} style={style}>{this.props.children}</div>
    );
  },
});

module.exports = center;
