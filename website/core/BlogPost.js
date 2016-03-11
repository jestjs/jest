/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule BlogPost
 * @jsx React.DOM
 */

var Marked = require('Marked');
var React = require('React');

var BlogPost = React.createClass({
  render: function() {
    var post = this.props.post;
    var content = this.props.content;

    var match = post.path.match(/([0-9]+)\/([0-9]+)\/([0-9]+)/);
    // Because JavaScript sucks at date handling :(
    var year = match[1];
    var month = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ][parseInt(match[2], 10) + 1];
    var day = parseInt(match[3], 10);

    return (
      <div>
        <h1>{post.title}</h1>
        <p className="meta">{month} {day}, {year} by {post.author}</p>
        <hr />
        <Marked>{content}</Marked>
      </div>
    );
  }
});

module.exports = BlogPost;
