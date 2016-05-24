/**
 * @providesModule Container
 * @jsx React.DOM
 */

var React = require('React');
var classNames = require('classnames');

class Container extends React.Component {
  render() {
    var containerClasses = classNames('container', this.props.className, {
      'highlightBackground': this.props.background === "highlight",
      'lightBackground': this.props.background === "light",
      'paddingAll': this.props.padding.indexOf('all') >= 0,
      'paddingBottom': this.props.padding.indexOf('bottom') >= 0,
      'paddingLeft': this.props.padding.indexOf('left') >= 0,
      'paddingRight': this.props.padding.indexOf('right') >= 0,
      'paddingTop': this.props.padding.indexOf('top') >= 0,
    });
    if (this.props.wrapper) {
      var wrappedChildren =
        <div className="wrapper">{this.props.children}</div>;
    } else {
      var wrappedChildren = this.props.children;
    }
    return (
      <div className={containerClasses} id={this.props.id}>
        {wrappedChildren}
      </div>
    );
  }
};

Container.defaultProps = {
  background: "transparent",
  padding: [],
  wrapper: true,
};

module.exports = Container;
