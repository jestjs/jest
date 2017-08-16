/**
 * @providesModule Header
 * @jsx React.DOM
 */

/* eslint-disable sort-keys */

const React = require('React');
const toSlug = require('toSlug');

const Header = React.createClass({
  render() {
    const slug = toSlug(this.props.toSlug || this.props.children);
    const Heading = 'h' + this.props.level;

    return (
      <Heading {...this.props}>
        <a className="anchor" name={slug} />
        {this.props.children}{' '}
        <a className="hash-link" href={'#' + slug}>
          #
        </a>
      </Heading>
    );
  },
});

module.exports = Header;
