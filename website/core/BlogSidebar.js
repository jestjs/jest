/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule BlogSidebar
 * @jsx React.DOM
 */

var MetadataBlog = require('MetadataBlog');
var React = require('React');

var BlogSidebar = React.createClass({
  render: function() {
    return (
      <div className="nav-docs">
        <div className="nav-docs-section">
          <h3>Recent Posts</h3>
          <ul>
            {MetadataBlog.files.map(function(post) {
              return (
                <li key={post.path}>
                  <a
                    className={this.props.title === post.title ? 'active' : ''}
                    href={'/jest/blog/' + post.path}>
                    {post.title}
                  </a>
                </li>
              );
            }.bind(this))}
          </ul>
        </div>
      </div>
    );
  }
});

module.exports = BlogSidebar;
