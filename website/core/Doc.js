/**
 * @providesModule Doc
 * @jsx React.DOM
 */

const React = require('React');
const Marked = require('Marked');

class Doc extends React.Component {
  render() {
    let editLink = (
      <a
        className="edit-page-link button"
        href={
          'https://github.com/facebook/jest/edit/master/docs/' +
          (this.props.language || 'en') +
          '/' +
          this.props.source
        }
        target="_blank"
      >
        Edit this Doc
      </a>
    );
    if (this.props.language != 'en') {
      editLink = (
        <a
          className="edit-page-link button"
          href={'https://crowdin.com/project/jest/' + this.props.language}
          target="_blank"
        >
          Translate this Doc
        </a>
      );
    }

    return (
      <div className="post">
        <header className="postHeader">
          {editLink}
          <h1>
            {this.props.title}
          </h1>
        </header>
        <article>
          <Marked>
            {this.props.content}
          </Marked>
        </article>
      </div>
    );
  }
}

module.exports = Doc;
