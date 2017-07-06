/**
 * @providesModule center
 * @jsx React.DOM
 */

const React = require('React');

const assign = require('object-assign');

const center = React.createClass({
  render() {
    const {style, ...props} = this.props;
    const newStyle = assign({}, style, {textAlign: 'center'});

    return (
      <div {...props} style={newStyle}>
        {this.props.children}
      </div>
    );
  },
});

module.exports = center;
