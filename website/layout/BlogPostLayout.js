/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule BlogPostLayout
 * @jsx React.DOM
 */

var Marked = require('Marked');
var MetadataBlog = require('MetadataBlog');
var React = require('React');
var Site = require('Site');

var BlogPostLayout = React.createClass({
  renderSidebar: function(current) {
    return (
      <div className="nav-docs">
        <div className="nav-docs-section">
          <h3>Recent Posts</h3>
          <ul>
            {MetadataBlog.files.map(function(post) {
              return (
                <li key={post.path}>
                  <a
                    className={current.title === post.title ? 'active' : ''}
                    href={'/jest/blog/' + post.path}>
                    {post.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  },

  render: function() {
    var metadata = this.props.metadata;
    var content = this.props.children;

    var match = metadata.path.match(/([0-9]+)\/([0-9]+)\/([0-9]+)/);
    // Because JavaScript sucks at date handling :(
    var year = match[1];
    var month = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ][parseInt(match[2], 10) + 1];
    var day = parseInt(match[3], 10);

    return (
      <Site section="blog">
        <section className="content wrap documentationContent">
          {this.renderSidebar(this.props.metadata)}
          <div className="inner-content">
            <h1>{metadata.title}</h1>
            <p className="meta">{month} {day}, {year} by {metadata.author}</p>
            <hr />
            <Marked>{content}</Marked>
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = BlogPostLayout;
