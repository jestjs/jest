/**
 * @providesModule Doc
 * @jsx React.DOM
 */

const React = require('React');
const Marked = require('Marked');

class Doc extends React.Component {
  render() {
    return (
      <div className="post">
        <header className="postHeader">
          <a className="edit-page-link button" href={'https://github.com/facebook/jest/edit/master/docs/' + this.props.source} target="_blank">Edit on GitHub</a>
          <h1>{this.props.title}</h1>
        </header>
        <article>
          <Marked>{this.props.content}</Marked>
        </article>
      </div>
    );
  }
}

module.exports = Doc;
