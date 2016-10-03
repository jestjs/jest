/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule BlogPost
 * @jsx React.DOM
 */

var Marked = require('Marked');
var React = require('React');
var siteConfig = require('../siteConfig');

var BlogPost = React.createClass({
  renderContent: function() {
    var content = this.props.content;
    if (this.props.truncate) {
      content = content.split("<!--truncate-->")[0];
      return (
        <article className="post-content">
          <Marked>{content}</Marked>
          <div className="read-more">
            <a href={"/jest/blog/"+this.props.post.path}>Read More</a>
          </div>
        </article>
      );
    }
    return <Marked>{content}</Marked>;
  },
  renderAuthorPhoto: function() {
    var post = this.props.post;
    if (post.authorFBID) {
      return (
        <div className="authorPhoto">
          <a href={post.authorURL} target="_blank">
            <img src={"https://graph.facebook.com/"+post.authorFBID+"/picture/?height=200&width=200"} />
          </a>
        </div>
      );
    }
  },
  renderTitle: function() {
    var post = this.props.post;
    return (
      <h1>
        <a href={"/jest/blog/"+post.path}>{post.title}</a>
      </h1>
    );
  },
  render: function() {
    var post = this.props.post;
    var match = post.path.match(/([0-9]+)\/([0-9]+)\/([0-9]+)/);
    // Because JavaScript sucks at date handling :(
    var year = match[1];
    var month = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ][parseInt(match[2], 10) - 1];
    var day = parseInt(match[3], 10);

    return (
      <div className="post">
        <header className="postHeader">
          {this.renderAuthorPhoto()}
          <p className="post-authorName">
            <a href={post.authorURL} target="_blank">{post.author}</a>
          </p>
          {this.renderTitle()}
          <p className="post-meta">
            {siteConfig.githubButton}
          </p>
          <p className="post-meta">
            {month} {day}, {year}
          </p>
        </header>
        {this.renderContent()}
      </div>
    );
  }
});

module.exports = BlogPost;
